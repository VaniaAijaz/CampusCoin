const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

// Generate personalized saving tips based on user's transaction data
const getTips = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // This month expenses by category
    const thisMonth = await Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: thisMonthStart, $lte: thisMonthEnd }, isDeleted: false } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
    ]);

    // Last month expenses by category
    const lastMonth = await Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: lastMonthStart, $lte: lastMonthEnd }, isDeleted: false } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
    ]);
    const lastMonthMap = {};
    lastMonth.forEach((e) => { lastMonthMap[e._id.toString()] = e.total; });

    // Budgets this month
    const budgets = await Budget.find({ userId, month: thisMonthStart });
    const budgetMap = {};
    budgets.forEach((b) => { budgetMap[b.categoryId.toString()] = b; });

    const tips = [];

    for (const item of thisMonth) {
      const catId = item._id.toString();
      const catName = item.cat.name;
      const current = item.total;
      const last = lastMonthMap[catId] || 0;
      const budget = budgetMap[catId];

      // Tip: spending more than last month
      if (last > 0 && current > last * 1.15) {
        const diff = (current - last).toFixed(2);
        tips.push({
          id: `increase_${catId}`,
          category: catName,
          message: `Your ${catName} spending is $${diff} higher than last month. Try cutting back to save more.`,
          impact: current - last,
          type: "increase",
        });
      }

      // Tip: near or over budget
      if (budget && budget.limitAmount > 0) {
        const pct = current / budget.limitAmount;
        if (pct >= 1) {
          tips.push({
            id: `over_budget_${catId}`,
            category: catName,
            message: `You've exceeded your ${catName} budget of $${budget.limitAmount.toFixed(2)} by $${(current - budget.limitAmount).toFixed(2)}.`,
            impact: current - budget.limitAmount,
            type: "over_budget",
          });
        } else if (pct >= 0.8) {
          tips.push({
            id: `near_budget_${catId}`,
            category: catName,
            message: `You've used ${Math.round(pct * 100)}% of your ${catName} budget. Only $${(budget.limitAmount - current).toFixed(2)} remaining.`,
            impact: current,
            type: "near_budget",
          });
        }
      }
    }

    // Sort by impact descending
    tips.sort((a, b) => b.impact - a.impact);

    res.json({ success: true, tips: tips.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tips/ai-categorize — suggest a category based on description keywords
const aiCategorize = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ success: false, message: "Description is required." });

    const desc = description.toLowerCase();
    const rules = [
      { keywords: ["cafe", "restaurant", "food", "eat", "lunch", "dinner", "breakfast", "pizza", "burger", "canteen", "biryani", "chai"], category: "Food" },
      { keywords: ["bus", "uber", "taxi", "ride", "train", "metro", "fuel", "petrol", "transport", "rickshaw"], category: "Transport" },
      { keywords: ["rent", "hostel", "room", "accommodation", "housing", "flat"], category: "Hostel/Rent" },
      { keywords: ["book", "tuition", "stationery", "course", "exam", "fee", "library", "pen", "notebook", "academic"], category: "Academics" },
      { keywords: ["netflix", "spotify", "subscription", "youtube premium", "app", "streaming"], category: "Subscriptions" },
      { keywords: ["movie", "cinema", "concert", "game", "party", "outing", "entertainment"], category: "Entertainment" },
      { keywords: ["allowance", "pocket money", "family"], category: "Allowance" },
      { keywords: ["salary", "job", "work", "freelance", "part-time", "part time"], category: "Part-time Job" },
      { keywords: ["scholarship", "grant", "bursary"], category: "Scholarship" },
      { keywords: ["gift", "birthday", "eid", "present"], category: "Gift" },
    ];

    let suggestion = null;
    for (const rule of rules) {
      if (rule.keywords.some((kw) => desc.includes(kw))) {
        suggestion = rule.category;
        break;
      }
    }

    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tips/forecast — simple next-month forecast
const forecast = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const results = [];

    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [inc, exp] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId, type: "income", date: { $gte: start, $lte: end }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { userId, type: "expense", date: { $gte: start, $lte: end }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      results.push({ income: inc[0]?.total || 0, expense: exp[0]?.total || 0 });
    }

    const avgIncome = results.reduce((s, r) => s + r.income, 0) / 3;
    const avgExpense = results.reduce((s, r) => s + r.expense, 0) / 3;

    res.json({
      success: true,
      forecast: {
        income: parseFloat(avgIncome.toFixed(2)),
        expense: parseFloat(avgExpense.toFixed(2)),
        balance: parseFloat((avgIncome - avgExpense).toFixed(2)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTips, aiCategorize, forecast };
