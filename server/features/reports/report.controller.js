const Transaction = require("../transactions/Transaction.model");
const { redisClient } = require("../../core/redis");

// Helper for caching
const cacheResponse = async (key, fetcher, ttl = 3600) => {
  if (redisClient?.isOpen) {
    try {
      const cached = await redisClient.get(key);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      // Ignore cache lookup errors if closed or failing
    }
  }
  
  const data = await fetcher();
  
  if (redisClient?.isOpen) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (err) {
      // Ignore cache set errors
    }
  }
  
  return data;
};

// GET /api/reports/monthly-summary?month=YYYY-MM
const monthlySummary = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const cacheKey = `reports:${req.user._id}:monthlySummary:${monthStr}`;
    
    const data = await cacheResponse(cacheKey, async () => {
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

      return {
        success: true,
        income: income[0]?.total || 0,
        expense: expense[0]?.total || 0,
        balance: (income[0]?.total || 0) - (expense[0]?.total || 0),
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/by-category?month=YYYY-MM&type=expense
const byCategory = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const type = req.query.type || "expense";
    const cacheKey = `reports:${req.user._id}:byCategory:${type}:${monthStr}`;

    const data = await cacheResponse(cacheKey, async () => {
      const [year, month] = monthStr.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const result = await Transaction.aggregate([
        { $match: { userId: req.user._id, type, date: { $gte: start, $lte: end }, isDeleted: false } },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, total: 1, count: 1, name: "$category.name", icon: "$category.icon", color: "$category.color" } },
        { $sort: { total: -1 } },
      ]);
      return { success: true, data: result };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/six-months
const sixMonths = async (req, res) => {
  try {
    const now = new Date();
    const cacheKey = `reports:${req.user._id}:sixMonths:${now.getFullYear()}-${now.getMonth()}`;

    const data = await cacheResponse(cacheKey, async () => {
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
      return { success: true, data: results };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/daily?month=YYYY-MM
const dailySummary = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const cacheKey = `reports:${req.user._id}:dailySummary:${monthStr}`;

    const data = await cacheResponse(cacheKey, async () => {
      const [year, month] = monthStr.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);

      const result = await Transaction.aggregate([
        { $match: { userId: req.user._id, date: { $gte: start, $lte: end }, isDeleted: false } },
        {
          $group: {
            _id: { day: { $dayOfMonth: "$date" }, type: "$type" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]);
      return { success: true, data: result };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/top-category
const topCategory = async (req, res) => {
  try {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${now.getMonth()}`;
    const cacheKey = `reports:${req.user._id}:topCategory:${monthStr}`;

    const data = await cacheResponse(cacheKey, async () => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const result = await Transaction.aggregate([
        { $match: { userId: req.user._id, type: "expense", date: { $gte: start, $lte: end }, isDeleted: false } },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
        { $unwind: "$category" },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]);
      return { success: true, topCategory: result[0] || null };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { monthlySummary, byCategory, sixMonths, dailySummary, topCategory };
