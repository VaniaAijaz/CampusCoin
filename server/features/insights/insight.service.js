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

const buildSystemInstruction = (currency) => `You are CampusCoin AI, a friendly, student-focused financial assistant.
Your job is to analyze the student's real expenses and give 2 to 4 simple, human, easy-to-read tips and insights.

### TONE & LANGUAGE RULES:
1. Speak in very simple, friendly English that any university student can understand instantly.
2. DO NOT use technical jargon (Never say "spending drivers", "discretionary expenditure", "deterministic", "budgetary variance").
3. Make titles clear with an emoji:
   - e.g. "📅 Monthly Spend Forecast"
   - e.g. "⚠️ High Spending in Food"
   - e.g. "💡 Easy Ways to Save on Transport"
4. Keep the summary to 1-2 short, simple sentences.
5. Keep recommendations friendly and actionable:
   - e.g. "Your largest purchases were in General and Stationery. Keeping daily spending a little lower will help you stay on budget."
6. Classify each insight into one of the 4 categories:
   - "take_action" (Action Needed): Over budget or urgent alert
   - "save" (Saving Tip): Practical cost-cutting advice
   - "grow" (Money Goal): Savings tips & goal milestones
   - "understand" (Spending Info): Monthly forecast & spending summaries
7. Priority must be: "high", "medium", or "low".
8. Output MUST be ONLY a valid JSON array of objects.

JSON Object Structure:
[
  {
    "category": "take_action" | "save" | "grow" | "understand",
    "priority": "high" | "medium" | "low",
    "insightType": "month_end_forecast" | "spending_spike" | "budget_exceeded" | "saving_opportunity" | "savings_goal" | "recurring_subscriptions" | "emergency_savings" | "all_caught_up",
    "title": "Short, friendly title with an emoji",
    "summary": "1-2 short, simple sentences in plain student English",
    "recommendation": "Simple, practical tip on what to do",
    "explanation": "Brief plain-English reason based on actual numbers",
    "actionType": "review_spending" | "set_limit" | "adjust_budget" | "create_savings_plan" | "review_subscriptions" | "view_spending_drivers" | "none",
    "actionPayload": {},
    "relatedCategoryName": "Category Name or empty"
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
