const mongoose = require("mongoose");
const Insight = require("./Insight.model");
const Transaction = require("../transactions/Transaction.model");
const Category = require("../categories/Category.model");
const User = require("../auth/User.model");
const Budget = require("../budgets/Budget.model");
const Subscription = require("../subscriptions/Subscription.model");
const Debt = require("../debts/Debt.model");
const Goal = require("../goals/Goal.model");
const { redisClient } = require("../../core/redis");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Analyze spending velocity and generate plain-text actionable financial advice
const generateInsightForMonth = async (userId, year, month) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = (now.getFullYear() === year && now.getMonth() === month - 1) ? now.getDate() : daysInMonth;
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // Current month expenses by category
  const currentExpenses = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  // Prior 3 months average per category
  const threeMonthsAgo = new Date(year, month - 4, 1);
  const priorExpenses = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: threeMonthsAgo, $lt: startOfMonth }, isDeleted: false } },
    { $group: { _id: { cat: "$categoryId", month: { $month: "$date" } }, total: { $sum: "$amount" } } },
    { $group: { _id: "$_id.cat", avg: { $avg: "$total" } } },
  ]);

  const avgMap = {};
  priorExpenses.forEach((e) => { avgMap[e._id.toString()] = e.avg; });

  const totalIncome = await Transaction.aggregate([
    { $match: { userId, type: "income", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalExpense = currentExpenses.reduce((s, e) => s + e.total, 0);
  const income = totalIncome[0]?.total || 0;
  const balance = income - totalExpense;

  // Calculate velocity
  const dailyBurnRate = currentDay > 0 ? totalExpense / currentDay : 0;
  const projectedMonthEndExpense = totalExpense + (dailyBurnRate * daysRemaining);
  let velocityStatus = "safe";
  if (income > 0) {
    if (projectedMonthEndExpense > income * 1.1) velocityStatus = "danger";
    else if (projectedMonthEndExpense > income * 0.9) velocityStatus = "caution";
  } else if (totalExpense > 300) {
    velocityStatus = "caution";
  }

  // Detect flagged categories
  const flagged = [];
  for (const item of currentExpenses) {
    const avg = avgMap[item._id.toString()];
    if (avg && item.total > avg * 1.2) {
      const cat = await Category.findById(item._id);
      const pct = Math.round(((item.total - avg) / avg) * 100);
      flagged.push({
        categoryId: item._id,
        categoryName: cat?.name || "Other",
        currentAmount: item.total,
        avgAmount: avg,
        percentChange: pct,
      });
    }
  }
  flagged.sort((a, b) => b.percentChange - a.percentChange);

  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  // Plain language summary
  let summaryText = `In ${monthName}, you tracked $${income.toFixed(2)} in total earnings against $${totalExpense.toFixed(2)} in recorded expenses. `;
  if (balance >= 0) {
    summaryText += `Your current net surplus is $${balance.toFixed(2)}, pacing with a daily burn rate of $${dailyBurnRate.toFixed(2)}/day.`;
  } else {
    summaryText += `Your current monthly spending outpaces income by $${Math.abs(balance).toFixed(2)}. Your burn rate is $${dailyBurnRate.toFixed(2)}/day.`;
  }

  if (flagged.length > 0) {
    const top = flagged[0];
    summaryText += ` Notable acceleration detected in ${top.categoryName}, which is up +${top.percentChange}% compared to your 3-month baseline.`;
  }

  // Actionable plain-text financial advice
  const actionableAdvice = [];

  if (flagged.length > 0) {
    const top = flagged[0];
    const targetDaily = ((top.avgAmount * 1.1) - (top.currentAmount * 0.8)) / daysRemaining;
    actionableAdvice.push({
      title: `Cool down ${top.categoryName} spending`,
      action: `You've spent $${top.currentAmount.toFixed(2)} on ${top.categoryName}. Try capping this to $${Math.max(5, targetDaily).toFixed(0)}/day for the remaining ${daysRemaining} days to prevent an end-of-month budget blowout.`,
      impact: `Potential savings of $${Math.max(15, (top.currentAmount - top.avgAmount)).toFixed(0)}`,
      urgency: "high",
    });
  }

  if (velocityStatus === "danger") {
    actionableAdvice.push({
      title: "Pacing Warning: Projected Deficit",
      action: `At your current velocity of $${dailyBurnRate.toFixed(2)}/day, month-end expenses will reach $${projectedMonthEndExpense.toFixed(2)}. Pause discretionary purchases and stick to essential groceries and transport.`,
      impact: "Preserves emergency student buffer",
      urgency: "high",
    });
  } else if (velocityStatus === "caution") {
    actionableAdvice.push({
      title: "Moderate Spending Velocity",
      action: `You have ${daysRemaining} days left in the billing cycle. Keeping daily non-essential expenses under $${(Math.max(0, balance) / daysRemaining).toFixed(0)} ensures a positive savings outcome.`,
      impact: "Maintains budget solvency",
      urgency: "medium",
    });
  } else {
    actionableAdvice.push({
      title: "Campus Savings Booster",
      action: `Your cash flow is steady. Transfer 15% ($${(income * 0.15).toFixed(0)}) of this month's surplus into a dedicated student emergency stash or textbook reserve.`,
      impact: `Boosts savings goal by $${(income * 0.15).toFixed(0)}`,
      urgency: "low",
    });
  }

  actionableAdvice.push({
    title: "Student Dining & Subscriptions Audit",
    action: "Review recurring monthly platform subscriptions and food delivery fees. Switching just one meal per week to home prep or campus dining hall saves ~$45/month.",
    impact: "Saves ~$45/month recurring",
    urgency: "low",
  });

  let tipText = actionableAdvice[0]?.action || "Keep logging daily expenses to refine your AI budget health score.";

  return {
    summaryText,
    tipText,
    actionableAdvice,
    spendingVelocity: {
      dailyBurnRate: parseFloat(dailyBurnRate.toFixed(2)),
      projectedMonthEndExpense: parseFloat(projectedMonthEndExpense.toFixed(2)),
      velocityStatus,
    },
    flaggedCategories: flagged,
  };
};

// GET /api/insights
const getInsights = async (req, res) => {
  try {
    const insights = await Insight.find({ userId: req.user._id })
      .populate("flaggedCategories.categoryId", "name icon color")
      .sort({ month: -1 })
      .limit(12);
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/insights/generate?month=YYYY-MM
const generateInsight = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);

    // Refresh or create insight
    const { summaryText, tipText, actionableAdvice, spendingVelocity, flaggedCategories } =
      await generateInsightForMonth(req.user._id, year, month);

    const insight = await Insight.findOneAndUpdate(
      { userId: req.user._id, month: monthDate },
      {
        summaryText,
        tipText,
        actionableAdvice,
        spendingVelocity,
        flaggedCategories,
        generatedAt: new Date(),
      },
      { upsert: true, new: true }
    ).populate("flaggedCategories.categoryId", "name icon color");

    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/insights/:id/bookmark
const toggleBookmark = async (req, res) => {
  try {
    const insight = await Insight.findOne({ _id: req.params.id, userId: req.user._id });
    if (!insight) return res.status(404).json({ success: false, message: "Insight not found." });
    insight.isBookmarked = !insight.isBookmarked;
    await insight.save();
    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/insights/:id/pin
const togglePin = async (req, res) => {
  try {
    const insight = await Insight.findOne({ _id: req.params.id, userId: req.user._id });
    if (!insight) return res.status(404).json({ success: false, message: "Insight not found." });
    insight.isPinned = !insight.isPinned;
    await insight.save();
    res.json({ success: true, insight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- DYNAMIC AI INSIGHT ARCHITECTURE ---

const generateAiTip = async (userId, temperature = 0.4) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  const [
    incomeAgg,
    expenseAgg,
    topCategoriesAgg,
    budgets,
    upcomingSubscriptions,
    peerDebts,
    savingsGoals
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, type: "income", date: { $gte: thirtyDaysAgo }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: thirtyDaysAgo }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: thirtyDaysAgo }, isDeleted: false } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
      { $project: { name: "$cat.name", total: 1 } }
    ]),
    Budget.find({ userId }).populate("categoryId", "name"),
    Subscription.find({ userId, next_due_date: { $gte: new Date(), $lte: next7Days } }),
    Debt.find({ userId, settlement_status: "pending" }),
    Goal.find({ userId })
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  
  // Calculate budget limits
  const overBudgetCategories = budgets
    .filter(b => b.spentAmount > (b.limitAmount * 0.8))
    .map(b => `${b.categoryId?.name} (${Math.round((b.spentAmount / b.limitAmount) * 100)}%)`);

  const owedToMe = peerDebts.filter(d => d.direction === "owed_to_me").reduce((sum, d) => sum + d.amount, 0);
  const iOwe = peerDebts.filter(d => d.direction === "i_owe").reduce((sum, d) => sum + d.amount, 0);

  const dataSnapshot = {
    totalIncome,
    totalExpense,
    topCategories: topCategoriesAgg.map(c => `${c.name}: $${c.total}`),
    categoriesNearingLimit: overBudgetCategories,
    subscriptionsDueNext7Days: upcomingSubscriptions.map(s => `${s.service_name}: $${s.amount}`),
    debts: { owedToMe, iOwe },
    goals: savingsGoals.map(g => `${g.target_name}: $${g.current_saved} / $${g.target_amount}`)
  };

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "mock_key");
  // Default to a fallback if no key is present to prevent crashes in local dev
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
     return "No AI Key found: Pause discretionary spending and review your upcoming subscriptions this week to stay on track.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature } });
  
  const prompt = `You are an expert financial advisor for a university student. Based on this precise real-time spending snapshot:
${JSON.stringify(dataSnapshot)}

Provide one highly specific, actionable, plain-text tip under 20 words to help them optimize their current situation. Do not use quotes or introductory text.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error("Gemini AI generation failed:", err.message);
    return "Check your budget limits and settle any outstanding peer IOUs to keep your finances balanced this week.";
  }
};

const getDynamicInsight = async (req, res) => {
  try {
    const cacheKey = `ai_insight:${req.user._id}`;
    let cachedTip = null;
    if (redisClient?.isOpen) {
      try {
        cachedTip = await redisClient.get(cacheKey);
      } catch (e) {}
    }

    if (cachedTip) {
      return res.json({ success: true, tip: cachedTip });
    }

    const newTip = await generateAiTip(req.user._id, 0.4);
    
    if (redisClient?.isOpen) {
      try {
        await redisClient.set(cacheKey, newTip, { EX: 3600 }); // Cache for 1 hour
      } catch (e) {}
    }

    res.json({ success: true, tip: newTip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const regenerateDynamicInsight = async (req, res) => {
  try {
    const cacheKey = `ai_insight:${req.user._id}`;
    const newTip = await generateAiTip(req.user._id, 0.9); // Higher temperature for varied advice
    
    if (redisClient?.isOpen) {
      try {
        await redisClient.set(cacheKey, newTip, { EX: 3600 });
      } catch (e) {}
    }

    res.json({ success: true, tip: newTip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getInsights, generateInsight, toggleBookmark, togglePin, getDynamicInsight, regenerateDynamicInsight };
