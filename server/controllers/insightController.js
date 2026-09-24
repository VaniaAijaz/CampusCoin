const Insight = require("../models/Insight");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");

// Generate AI-like insight from transaction data (rule-based)
const generateInsightForMonth = async (userId, year, month) => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // Get current month expenses by category
  const currentExpenses = await Transaction.aggregate([
    { $match: { userId, type: "expense", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
    { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
  ]);

  // Get prior 3 months average per category
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

  const flagged = [];
  for (const item of currentExpenses) {
    const avg = avgMap[item._id.toString()];
    if (avg && item.total > avg * 1.2) {
      const cat = await Category.findById(item._id);
      const pct = Math.round(((item.total - avg) / avg) * 100);
      flagged.push({
        categoryId: item._id,
        categoryName: cat?.name || "Unknown",
        currentAmount: item.total,
        avgAmount: avg,
        percentChange: pct,
      });
    }
  }
  flagged.sort((a, b) => b.percentChange - a.percentChange);

  // Build plain language summary
  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
  let summaryText = `In ${monthName}, you earned $${income.toFixed(2)} and spent $${totalExpense.toFixed(2)}, `;
  summaryText += balance >= 0
    ? `leaving a balance of $${balance.toFixed(2)}.`
    : `exceeding your income by $${Math.abs(balance).toFixed(2)}.`;

  if (flagged.length > 0) {
    const top = flagged[0];
    summaryText += ` Notably, your ${top.categoryName} spending rose ${top.percentChange}% compared to your recent average.`;
  }

  let tipText = "";
  if (flagged.length > 0) {
    const top = flagged[0];
    tipText = `Consider setting a weekly cap on ${top.categoryName} to bring it closer to your average of $${top.avgAmount.toFixed(2)}/month.`;
  } else if (balance < 0) {
    tipText = "Your spending exceeded your income this month. Review your largest expense categories and set budget limits.";
  } else {
    tipText = `You stayed within your income this month. Try saving at least $${(income * 0.1).toFixed(2)} next month (10% of income).`;
  }

  return { summaryText, tipText, flaggedCategories: flagged };
};

// GET /api/insights
const getInsights = async (req, res) => {
  try {
    const insights = await Insight.find({ userId: req.user._id }).sort({ month: -1 }).limit(12);
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

    // Check if already exists
    let insight = await Insight.findOne({ userId: req.user._id, month: monthDate });
    if (!insight) {
      const { summaryText, tipText, flaggedCategories } = await generateInsightForMonth(req.user._id, year, month);
      insight = await Insight.create({
        userId: req.user._id,
        month: monthDate,
        summaryText,
        tipText,
        flaggedCategories,
      });
    }
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

module.exports = { getInsights, generateInsight, toggleBookmark, togglePin };
