const Transaction = require("../models/Transaction");

// GET /api/reports/monthly-summary?month=YYYY-MM
const monthlySummary = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [income, expense] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: req.user._id, type: "income", date: { $gte: start, $lte: end }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: req.user._id, type: "expense", date: { $gte: start, $lte: end }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      success: true,
      income: income[0]?.total || 0,
      expense: expense[0]?.total || 0,
      balance: (income[0]?.total || 0) - (expense[0]?.total || 0),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/by-category?month=YYYY-MM&type=expense
const byCategory = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const type = req.query.type || "expense";
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id, type, date: { $gte: start, $lte: end }, isDeleted: false } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, total: 1, count: 1, name: "$category.name", icon: "$category.icon", color: "$category.color" } },
      { $sort: { total: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/six-months
const sixMonths = async (req, res) => {
  try {
    const now = new Date();
    const results = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [inc, exp] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId: req.user._id, type: "income", date: { $gte: start, $lte: end }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: req.user._id, type: "expense", date: { $gte: start, $lte: end }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      results.push({
        month: start.toLocaleString("default", { month: "short" }),
        year: start.getFullYear(),
        income: inc[0]?.total || 0,
        expense: exp[0]?.total || 0,
      });
    }
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/daily?month=YYYY-MM
const dailySummary = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end }, isDeleted: false } },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$date" }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/top-category
const topCategory = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: "expense", date: { $gte: start, $lte: end }, isDeleted: false } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    res.json({ success: true, topCategory: data[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { monthlySummary, byCategory, sixMonths, dailySummary, topCategory };
