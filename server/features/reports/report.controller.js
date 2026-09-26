const Transaction = require("../transactions/Transaction.model");
const Subscription = require("../subscriptions/Subscription.model");
const CurrencyService = require("../../core/currency.service");
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
    const endDateStr = req.query.month || new Date().toISOString().split("T")[0];
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `reports:${req.user._id}:${userCurrency}:monthlySummary:${endDateStr}`;

    const data = await cacheResponse(cacheKey, async () => {
      const end = new Date(`${endDateStr}T23:59:59.999Z`);

      const [income, expense, subscriptions] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId: req.user._id, type: "income", date: { $lte: end }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { userId: req.user._id, type: "expense", date: { $lte: end }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Subscription.find({ user_id: req.user._id, createdAt: { $lte: end } }),
      ]);

      const baseIncome = income[0]?.total || 0;
      let baseExpense = expense[0]?.total || 0;

      // Add subscription costs
      let subsTotal = 0;
      subscriptions.forEach(sub => {
        // Calculate how many times this subscription was billed since creation up to endDate
        const createdDate = new Date(sub.createdAt);
        if (createdDate <= end) {
          if (sub.billing_cycle === 'monthly') {
            const monthsPassed = (end.getFullYear() - createdDate.getFullYear()) * 12 + (end.getMonth() - createdDate.getMonth()) + 1;
            subsTotal += sub.amount * Math.max(0, monthsPassed);
          } else if (sub.billing_cycle === 'yearly') {
            const yearsPassed = end.getFullYear() - createdDate.getFullYear() + 1;
            subsTotal += sub.amount * Math.max(0, yearsPassed);
          }
        }
      });
      baseExpense += subsTotal;

      const baseBalance = baseIncome - baseExpense;

      return {
        success: true,
        currency: userCurrency,
        income: CurrencyService.fromBase(baseIncome, userCurrency),
        expense: CurrencyService.fromBase(baseExpense, userCurrency),
        balance: CurrencyService.fromBase(baseBalance, userCurrency),
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
    const endDateStr = req.query.month || new Date().toISOString().split("T")[0];
    const type = req.query.type || "expense";
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `reports:${req.user._id}:${userCurrency}:byCategory:${type}:${endDateStr}`;

    const data = await cacheResponse(cacheKey, async () => {
      const end = new Date(`${endDateStr}T23:59:59.999Z`);

      const result = await Transaction.aggregate([
        { $match: { userId: req.user._id, type, date: { $lte: end }, isDeleted: false } },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, total: 1, count: 1, name: "$category.name", icon: "$category.icon", color: "$category.color" } },
        { $sort: { total: -1 } },
      ]);

      const formatted = result.map((r) => ({
        ...r,
        total: CurrencyService.fromBase(r.total, userCurrency),
      }));

      return { success: true, currency: userCurrency, data: formatted };
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
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `reports:${req.user._id}:${userCurrency}:sixMonths:${now.getFullYear()}-${now.getMonth()}`;

    const data = await cacheResponse(cacheKey, async () => {
      const results = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const [inc, exp, subs] = await Promise.all([
          Transaction.aggregate([
            { $match: { userId: req.user._id, type: "income", date: { $gte: start, $lte: end }, isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Transaction.aggregate([
            { $match: { userId: req.user._id, type: "expense", date: { $gte: start, $lte: end }, isDeleted: false } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Subscription.find({ user_id: req.user._id }),
        ]);

        const baseInc = inc[0]?.total || 0;
        let baseExp = exp[0]?.total || 0;

        let subsTotal = 0;
        const subMonth = start.getMonth();
        subs.forEach(sub => {
          if (sub.billing_cycle === 'monthly') {
            subsTotal += sub.amount;
          } else if (sub.billing_cycle === 'yearly') {
            const renewDate = new Date(sub.renewal_date);
            if (renewDate.getMonth() === subMonth) {
              subsTotal += sub.amount;
            }
          }
        });
        baseExp += subsTotal;

        results.push({
          month: start.toLocaleString("default", { month: "short" }),
          year: start.getFullYear(),
          income: CurrencyService.fromBase(baseInc, userCurrency),
          expense: CurrencyService.fromBase(baseExp, userCurrency),
        });
      }
      return { success: true, currency: userCurrency, data: results };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/daily?month=YYYY-MM
const dailySummary = async (req, res) => {
  try {
    const endDateStr = req.query.month || new Date().toISOString().split("T")[0];
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `reports:${req.user._id}:${userCurrency}:dailySummary:${endDateStr}`;

    const data = await cacheResponse(cacheKey, async () => {
      const end = new Date(`${endDateStr}T23:59:59.999Z`);
      const start = new Date(end.getFullYear(), end.getMonth(), 1); // keep daily summary for the selected month to not overload UI

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

      const formatted = result.map((item) => ({
        ...item,
        total: CurrencyService.fromBase(item.total, userCurrency),
      }));

      return { success: true, currency: userCurrency, data: formatted };
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
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `reports:${req.user._id}:${userCurrency}:topCategory:${monthStr}`;

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

      if (!result[0]) return { success: true, currency: userCurrency, topCategory: null };

      const top = {
        ...result[0],
        total: CurrencyService.fromBase(result[0].total, userCurrency),
      };

      return { success: true, currency: userCurrency, topCategory: top };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { monthlySummary, byCategory, sixMonths, dailySummary, topCategory };
