const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Insight = require("./Insight.model");
const { analyzeUserFinances, buildDeterministicFallbackInsights } = require("./insight.engine");
const { redisClient } = require("../../core/redis");

/**
 * Robust Gemini model candidate hierarchy for maximum availability
 */
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash-latest",
  "gemini-flash-latest",
];

const buildSystemInstruction = (currency) => `You are CampusCoin AI, an intelligent, empathetic, student-focused financial analysis copilot.
Your job is to analyze the authenticated student's REAL financial context and generate 2 to 5 completely dynamic, highly personalized, actionable financial insights.

### YOUR RULES:
1. NEVER hallucinate or invent fake transactions, spending numbers, or categories. All numbers MUST directly correspond to the supplied verified facts.
2. DO NOT use rigid canned scripts. Dynamically author the title, summary, explanation, and recommendation based on the student's actual circumstances.
3. Classify each insight into one of the 4 primary categories:
   - "take_action" (Red): Issues requiring urgent attention (overspending, budget exceeded, rapid burn velocity, upcoming shortfall)
   - "save" (Yellow): Opportunities to cut non-essential costs (dining out spikes, recurring subscriptions audit, discretionary purchases)
   - "grow" (Green): Long-term financial improvements (consistent monthly surplus, savings goal timelines, emergency cushions)
   - "understand" (Blue): Explaining behavior, month-over-month comparisons, month-end forecast breakdowns, or limited-data states
4. Priority must be: "high", "medium", or "low" based on financial urgency.
5. For discretionary spending, use careful phrasing: "These expenses appear to be discretionary based on their categories/descriptions." NEVER claim "These expenses are unnecessary."
6. For subscriptions: Transaction data alone cannot determine whether the student uses a subscription. NEVER claim "You aren't using this subscription." Instead say: "This payment appears regularly in your transaction history. Review your active subscriptions to confirm they still align with your campus routine."
7. In the "explanation" field ("Why am I getting this?"), transparently reference the student's actual metrics (Current spend, Historical average, Difference, Variance %, or Budget limit).
8. Action types must be one of:
   - "review_spending" (Payload: { categoryId, categoryName, search })
   - "set_limit" (Payload: { categoryId, categoryName, suggestedLimit })
   - "adjust_budget" (Payload: { categoryId, categoryName, suggestedLimit, suggestedBudgets })
   - "create_savings_plan" (Payload: { goalId, targetName, targetAmount, currentSaved, suggestedMonthly })
   - "review_subscriptions" (Payload: {})
   - "view_spending_drivers" (Payload: { drivers, dailyBurnRate, projectedMonthEndExpense })
   - "create_emergency_goal" (Payload: { suggestedTarget, suggestedMonthly })
   - "none" (Payload: {})
9. If the student has very few transactions (e.g. < 3), generate a friendly "Limited Data" insight in "understand" category explaining what data is missing.
10. If all spending is healthy, steady, and within budget, generate an encouraging "All Caught Up" insight rather than manufacturing fake problems.
11. Output MUST be ONLY a valid JSON array of objects.

JSON Object Structure:
[
  {
    "category": "take_action" | "save" | "grow" | "understand",
    "priority": "high" | "medium" | "low",
    "insightType": "high_spending" | "spending_spike" | "budget_exceeded" | "budget_shortfall_warning" | "saving_opportunity" | "savings_goal" | "recurring_subscriptions" | "transport_spike" | "discretionary_spending" | "month_end_forecast" | "emergency_savings" | "budget_adjustment" | "insufficient_data" | "all_caught_up",
    "title": "Short, engaging title with an emoji (e.g., 🍔 Food spending is elevated)",
    "summary": "1-2 sentence plain-language summary of what happened",
    "recommendation": "Specific, practical student advice on what to do next",
    "explanation": "Transparent reasoning explaining why this insight was generated based on the numbers",
    "actionType": "review_spending" | "set_limit" | "adjust_budget" | "create_savings_plan" | "review_subscriptions" | "view_spending_drivers" | "create_emergency_goal" | "none",
    "actionPayload": {},
    "relatedCategoryName": "Category Name or empty",
    "relatedCategoryId": "Valid category ObjectId or null"
  }
]`;

/**
 * Execute Gemini API with candidate model cascade
 */
const generateDynamicAiInsightsWithGemini = async (financialProfile, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemInstruction(financialProfile.currency);

  const prompt = `${systemInstruction}

### VERIFIED STUDENT FINANCIAL PROFILE:
${JSON.stringify(financialProfile, null, 2)}

Analyze this data and return your structured JSON insights array now:`;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          maxOutputTokens: 2500,
        },
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      // Clean and extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { success: true, insights: parsed, modelUsed: modelName };
        }
      }
    } catch (err) {
      console.warn(`[INSIGHTS] Gemini model ${modelName} call failed:`, err.message);
    }
  }

  return { success: false, error: "All AI model candidates failed or timed out." };
};

/**
 * Validates and attaches deterministic supporting metrics to AI-generated insights
 */
const validateAndEnrichAiInsights = (aiInsights, financialProfile, deterministicFallbackMap) => {
  const validated = [];
  const allowedCategories = ["take_action", "save", "grow", "understand"];
  const allowedPriorities = ["high", "medium", "low"];
  const allowedActions = [
    "review_spending",
    "set_limit",
    "adjust_budget",
    "create_savings_plan",
    "review_subscriptions",
    "view_spending_drivers",
    "create_emergency_goal",
    "none",
  ];

  for (const item of aiInsights) {
    if (!item.title || !item.summary || !item.recommendation) continue;

    const category = allowedCategories.includes(item.category) ? item.category : "understand";
    const priority = allowedPriorities.includes(item.priority) ? item.priority : "medium";
    const actionType = allowedActions.includes(item.actionType) ? item.actionType : "none";
    const insightType = item.insightType || "general_insight";

    // Lookup corresponding deterministic supporting metrics if available
    const fallback = deterministicFallbackMap[insightType] ||
      deterministicFallbackMap[`${insightType}_${item.relatedCategoryName}`] ||
      Object.values(deterministicFallbackMap)[0];

    // Find category ID if category name provided
    let relatedCategoryId = item.relatedCategoryId || null;
    if (!relatedCategoryId && item.relatedCategoryName) {
      const matchedCat = (financialProfile.categoriesBreakdown || []).find(
        (c) => c.categoryName?.toLowerCase() === item.relatedCategoryName?.toLowerCase()
      );
      if (matchedCat) relatedCategoryId = matchedCat.categoryId;
    }

    validated.push({
      category,
      priority,
      insightType,
      title: item.title.trim(),
      summary: item.summary.trim(),
      recommendation: item.recommendation.trim(),
      explanation: item.explanation?.trim() || fallback?.explanation || "Based on your recent transaction velocity and recorded category baselines.",
      supportingMetrics: fallback?.supportingMetrics || {
        currentAmount: financialProfile.totalExpense,
        currency: financialProfile.currency,
      },
      actionType,
      actionPayload: item.actionPayload || fallback?.actionPayload || {},
      relatedCategoryId: relatedCategoryId ? new mongoose.Types.ObjectId(relatedCategoryId.toString()) : undefined,
      relatedCategoryName: item.relatedCategoryName || "",
      generatedAt: new Date(),
    });
  }

  return validated;
};

/**
 * Main Orchestration Entry Point
 */
const refreshUserInsights = async (userId) => {
  if (!userId) return [];

  // 1. Run deterministic data extractor and get verified facts
  const { financialProfile, deterministicInsights } = await analyzeUserFinances(userId);

  // Build map of deterministic supporting metrics by type/category
  const deterministicFallbackMap = {};
  deterministicInsights.forEach((ins) => {
    const key = ins.relatedCategoryName ? `${ins.insightType}_${ins.relatedCategoryName}` : ins.insightType;
    deterministicFallbackMap[key] = ins;
    deterministicFallbackMap[ins.insightType] = ins;
  });

  // 2. Fetch existing user flags (bookmarks, pins, dismissed)
  const existingInsights = await Insight.find({ userId }).lean();
  const existingMap = {};
  existingInsights.forEach((ins) => {
    const key = `${ins.insightType}_${ins.relatedCategoryId ? ins.relatedCategoryId.toString() : "global"}`;
    existingMap[key] = ins;
  });

  // 3. Invoke fully dynamic AI analysis with Gemini
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  let finalInsights = [];

  if (apiKey && apiKey !== "your_gemini_api_key_here" && apiKey !== "your_api_key_here") {
    const aiResult = await generateDynamicAiInsightsWithGemini(financialProfile, apiKey);
    if (aiResult.success && aiResult.insights.length > 0) {
      finalInsights = validateAndEnrichAiInsights(aiResult.insights, financialProfile, deterministicFallbackMap);
    }
  }

  // If AI was not configured or all candidates failed, use dynamically synthesized insights from engine
  if (finalInsights.length === 0) {
    finalInsights = deterministicInsights;
  }

  // 4. Save/update in MongoDB with state preservation
  const savedInsights = [];
  for (const ins of finalInsights) {
    const key = `${ins.insightType}_${ins.relatedCategoryId ? ins.relatedCategoryId.toString() : "global"}`;
    const prev = existingMap[key];

    const isDismissed = prev ? prev.isDismissed : false;
    const isBookmarked = prev ? prev.isBookmarked : false;
    const isPinned = prev ? prev.isPinned : false;

    const saved = await Insight.findOneAndUpdate(
      {
        userId,
        insightType: ins.insightType,
        relatedCategoryId: ins.relatedCategoryId || null,
      },
      {
        ...ins,
        userId,
        isDismissed,
        isBookmarked,
        isPinned,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    savedInsights.push(saved);
  }

  // 5. Update Redis cache
  const cacheKey = `campuscoin:insights:${userId}`;
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.setEx(cacheKey, 900, JSON.stringify(savedInsights));
    } catch (_) {}
  }

  return savedInsights;
};

/**
 * Get active recommendations for student feed
 */
const getActiveInsightsForUser = async (userId, options = {}) => {
  const { category, isBookmarked, includeDismissed = false } = options;

  const query = { userId };
  if (!includeDismissed) {
    query.isDismissed = false;
  }
  if (category && category !== "all") {
    query.category = category;
  }
  if (isBookmarked) {
    query.isBookmarked = true;
  }

  let insights = await Insight.find(query)
    .populate("relatedCategoryId", "name icon color")
    .sort({ isPinned: -1, priority: 1, generatedAt: -1 })
    .lean();

  if (insights.length === 0 && (!category || category === "all")) {
    insights = await refreshUserInsights(userId);
  }

  return insights;
};

module.exports = {
  refreshUserInsights,
  getActiveInsightsForUser,
};
