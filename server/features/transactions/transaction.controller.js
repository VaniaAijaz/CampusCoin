const mongoose = require("mongoose");
const Transaction = require("./Transaction.model");
const Budget = require("../budgets/Budget.model");
const Category = require("../categories/Category.model");
const { redisClient } = require("../../core/redis");

// Invalidate cache for a user
const invalidateCache = async (userId) => {
  if (redisClient?.isOpen) {
    try {
      const keys = await redisClient.keys(`reports:${userId}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      // Ignore cache invalidation error if redis is closed
    }
  }
};

// Helper: update budget spent amount
const { sendBudgetAlertEmail } = require("../emails/email.service");
const User = require("../auth/User.model");

const updateBudgetSpent = async (userId, categoryId, month) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  const result = await Transaction.aggregate([
    {
      $match: {
        userId,
        categoryId: new mongoose.Types.ObjectId(categoryId),
        type: "expense",
        date: { $gte: startOfMonth, $lte: endOfMonth },
        isDeleted: false,
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const total = result[0]?.total || 0;
  
  const updatedBudget = await Budget.findOneAndUpdate(
    { userId, categoryId, month: startOfMonth },
    { spentAmount: total },
    { new: true }
  ).populate("categoryId");

  // Check 90% threshold for proactive notification
  if (updatedBudget && updatedBudget.limitAmount > 0) {
    const percentage = total / updatedBudget.limitAmount;
    if (percentage >= 0.90 && percentage < 1.0) {
      // Find user to get email
      const user = await User.findById(userId);
      if (user && user.email) {
        sendBudgetAlertEmail(user.email, updatedBudget.categoryId.name, total, updatedBudget.limitAmount).catch(console.error);
      }
    }
  }
};

// Detect unusually large or duplicate transactions
const detectFlags = async (userId, amount, categoryId, date, description) => {
  const flags = [];
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const duplicate = await Transaction.findOne({
    userId,
    amount,
    categoryId,
    description,
    createdAt: { $gte: twoMinutesAgo },
    isDeleted: false,
  });
  if (duplicate) flags.push("Possible duplicate transaction detected.");

  const stats = await Transaction.aggregate([
    { $match: { userId, categoryId: new mongoose.Types.ObjectId(categoryId), type: "expense", isDeleted: false } },
    { $group: { _id: null, avg: { $avg: "$amount" } } },
  ]);
  if (stats[0]?.avg && amount > stats[0].avg * 3) {
    flags.push(`Unusually large amount (avg: $${stats[0].avg.toFixed(2)}).`);
  }
  return flags;
};

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const { type, categoryId, startDate, endDate, search, cursor, limit = 20 } = req.query;
    const filter = { userId: req.user._id, isDeleted: false };
    
    if (type) filter.type = type;
    if (categoryId) filter.categoryId = categoryId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    if (search) filter.description = { $regex: search, $options: "i" };
    
    // Cursor-based pagination logic (assuming cursor is the _id of the last item, fetching older items)
    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const transactions = await Transaction.find(filter)
      .populate("categoryId", "name icon color type")
      .sort({ _id: -1 })
      .limit(parseInt(limit));
      
    const nextCursor = transactions.length > 0 ? transactions[transactions.length - 1]._id : null;

    res.json({
      success: true,
      transactions,
      nextCursor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  try {
    const { categoryId, amount, type, description, date, isRecurring, recurringFrequency } = req.body;
    if (!categoryId || !amount || !type) {
      return res.status(400).json({ success: false, message: "Category, amount and type are required." });
    }
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    const txDate = date ? new Date(date) : new Date();
    const parsedAmount = parseFloat(amount);
    const flagMessages = await detectFlags(req.user._id, parsedAmount, categoryId, txDate, description);

    const transaction = await Transaction.create({
      userId: req.user._id,
      categoryId,
      amount: parsedAmount,
      type,
      description: description || "",
      date: txDate,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      isFlagged: flagMessages.length > 0,
      flagReason: flagMessages.join(" "),
    });

    if (type === "expense") {
      await updateBudgetSpent(req.user._id, categoryId, txDate);
    }
    
    await invalidateCache(req.user._id);

    const populated = await transaction.populate("categoryId", "name icon color type");
    res.status(201).json({ success: true, transaction: populated, flags: flagMessages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }
    const oldCategoryId = transaction.categoryId;
    const oldDate = transaction.date;

    const { categoryId, amount, type, description, date, isRecurring, recurringFrequency } = req.body;
    if (categoryId) transaction.categoryId = categoryId;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (type) transaction.type = type;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) transaction.recurringFrequency = recurringFrequency;

    await transaction.save();

    if (transaction.type === "expense") {
      await updateBudgetSpent(req.user._id, oldCategoryId, oldDate);
      if (categoryId && categoryId !== String(oldCategoryId)) {
        await updateBudgetSpent(req.user._id, transaction.categoryId, transaction.date);
      }
    }
    
    await invalidateCache(req.user._id);

    const populated = await transaction.populate("categoryId", "name icon color type");
    res.json({ success: true, transaction: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }
    transaction.isDeleted = true;
    await transaction.save();
    if (transaction.type === "expense") {
      await updateBudgetSpent(req.user._id, transaction.categoryId, transaction.date);
    }
    
    await invalidateCache(req.user._id);
    
    res.json({ success: true, message: "Transaction deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transactions/import-csv
const importCSV = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows provided." });
    }
    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId: req.user._id }],
    });
    const catMap = {};
    categories.forEach((c) => { catMap[c.name.toLowerCase()] = c._id; });

    const toInsert = [];
    const skipped = [];

    for (const row of rows) {
      const catId = catMap[row.categoryName?.toLowerCase()] || catMap["miscellaneous"];
      if (!catId || !row.amount || !row.type) {
        skipped.push(row);
        continue;
      }
      toInsert.push({
        userId: req.user._id,
        categoryId: catId,
        amount: parseFloat(row.amount),
        type: row.type,
        description: row.description || "",
        date: row.date ? new Date(row.date) : new Date(),
      });
    }

    if (toInsert.length > 0) await Transaction.insertMany(toInsert);
    
    await invalidateCache(req.user._id);
    
    res.json({ success: true, imported: toInsert.length, skipped: skipped.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transactions/recent
const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id, isDeleted: false })
      .populate("categoryId", "name icon color type")
      .sort({ date: -1, createdAt: -1 })
      .limit(6);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transactions/dashboard-metrics
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `reports:${userId}:dashboardMetrics`;
    
    if (redisClient?.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (err) {
        // Ignore cache fetch error
      }
    }
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Current month totals
    const [monthIncome, monthExpense] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, type: "income", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { userId, type: "expense", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const incomeTotal = monthIncome[0]?.total || 0;
    const expenseTotal = monthExpense[0]?.total || 0;
    const netSavings = incomeTotal - expenseTotal;

    // 6-Month Trend Aggregation Pipeline
    const sixMonthTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const [mInc, mExp] = await Promise.all([
        Transaction.aggregate([
          { $match: { userId, type: "income", date: { $gte: mStart, $lte: mEnd }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Transaction.aggregate([
          { $match: { userId, type: "expense", date: { $gte: mStart, $lte: mEnd }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      sixMonthTrends.push({
        month: mStart.toLocaleString("default", { month: "short" }),
        year: mStart.getFullYear(),
        income: mInc[0]?.total || 0,
        expense: mExp[0]?.total || 0,
      });
    }

    // Category breakdown for current month
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { userId, type: "expense", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, total: 1, count: 1, name: "$category.name", icon: "$category.icon", color: "$category.color" } },
      { $sort: { total: -1 } },
    ]);

    const responseData = {
      success: true,
      currentMonth: {
        income: incomeTotal,
        expense: expenseTotal,
        netSavings,
      },
      trends: sixMonthTrends,
      categoryBreakdown,
    };
    
    if (redisClient?.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
      } catch (err) {
        // Ignore cache set error
      }
    }
    
    res.json(responseData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importCSV,
  getRecentTransactions,
  getDashboardMetrics,
};
