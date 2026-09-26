const mongoose = require("mongoose");
const Transaction = require("./Transaction.model");
const Budget = require("../budgets/Budget.model");
const Category = require("../categories/Category.model");
const Subscription = require("../subscriptions/Subscription.model");
const User = require("../auth/User.model");
const CurrencyService = require("../../core/currency.service");
const { redisClient } = require("../../core/redis");
const { invalidateUserCache } = require("../../core/cacheMiddleware");
const { sendBudgetAlertEmail } = require("../emails/email.service");

/**
 * Dynamic Trigger Logic:
 * Recalculates total spent for the category in the specified month in base currency (USD)
 * and verifies/triggers alerts against the BUDGET table.
 */
const updateBudgetSpent = async (userId, categoryId, txDate) => {
  try {
    const dateObj = new Date(txDate);
    const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          categoryId: new mongoose.Types.ObjectId(categoryId),
          type: "expense",
          date: { $gte: startOfMonth, $lte: endOfMonth },
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalSpentInBase = result[0]?.total || 0;

    const updatedBudget = await Budget.findOneAndUpdate(
      { userId, categoryId, month: startOfMonth },
      { spentAmount: totalSpentInBase },
      { new: true }
    ).populate("categoryId");

    if (updatedBudget && updatedBudget.limitAmount > 0) {
      const ratio = totalSpentInBase / updatedBudget.limitAmount;

      // Proactive email alert threshold (>= 90%)
      if (ratio >= 0.90 && !updatedBudget.alertSent) {
        const user = await User.findById(userId);
        if (user?.email) {
          const userCurrency = CurrencyService.getUserCurrency(user);
          const formattedSpent = CurrencyService.fromBase(totalSpentInBase, userCurrency);
          const formattedLimit = CurrencyService.fromBase(updatedBudget.limitAmount, userCurrency);
          sendBudgetAlertEmail(
            user.email,
            updatedBudget.categoryId?.name || "Expense",
            formattedSpent,
            formattedLimit
          ).catch(console.error);

          updatedBudget.alertSent = true;
          await updatedBudget.save();
        }
      } else if (ratio < 0.80 && updatedBudget.alertSent) {
        // Reset alert if user deletes/reduces expenses back under threshold
        updatedBudget.alertSent = false;
        await updatedBudget.save();
      }
    }

    return { totalSpent: totalSpentInBase, budget: updatedBudget };
  } catch (err) {
    console.error("[BUDGET TRIGGER ERROR]:", err.message);
  }
};

/**
 * Anomaly & duplicate detection
 */
const detectFlags = async (userId, amountInBase, categoryId, date, description) => {
  const flags = [];
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const duplicate = await Transaction.findOne({
    userId,
    amount: { $gte: amountInBase - 0.01, $lte: amountInBase + 0.01 },
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
  if (stats[0]?.avg && amountInBase > stats[0].avg * 3) {
    flags.push("Unusually large amount relative to past spending.");
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

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const queryHash = Buffer.from(JSON.stringify(req.query)).toString('base64');
    const cacheKey = `campuscoin:user:${req.user._id}:transactions:${queryHash}`;

    if (redisClient?.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (err) {}
    }

    const transactions = await Transaction.find(filter)
      .populate("categoryId", "name icon color type isDefault is_default")
      .sort({ _id: -1 })
      .limit(parseInt(limit));

    const nextCursor = transactions.length > 0 ? transactions[transactions.length - 1]._id : null;
    const userCurrency = CurrencyService.getUserCurrency(req.user);

    // Dynamically convert base amounts to user currency preference
    const formatted = transactions.map((t) => {
      const obj = t.toObject({ virtuals: true });
      obj.amount = CurrencyService.fromBase(t.amount, userCurrency);
      obj.currency = userCurrency;
      return obj;
    });

    const responseData = {
      success: true,
      transactions: formatted,
      currency: userCurrency,
      nextCursor,
    };

    if (redisClient?.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData)); // 10 min cache
      } catch (err) {}
    }

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transactions
const createTransaction = async (req, res) => {
  try {
    const {
      categoryId,
      category_id,
      categoryName,
      amount,
      type,
      description,
      date,
      paymentMethod,
      transactionId,
      transaction_id,
      isRecurring,
      recurringFrequency,
    } = req.body;

    const targetCategoryInput = categoryId || category_id;
    if ((!targetCategoryInput && !categoryName) || !amount || !type) {
      return res.status(400).json({ success: false, message: "Category, amount and type are required." });
    }

    let resolvedCategoryId = null;
    if (targetCategoryInput && mongoose.Types.ObjectId.isValid(targetCategoryInput)) {
      const category = await Category.findById(targetCategoryInput);
      if (category) resolvedCategoryId = category._id;
    }

    // Dynamic category resolution / auto-creation
    if (!resolvedCategoryId && (categoryName || targetCategoryInput)) {
      const targetName = (categoryName || targetCategoryInput).trim();
      let cat = await Category.findOne({
        name: { $regex: new RegExp(`^${targetName}$`, "i") },
        type,
        $or: [{ userId: req.user._id }, { isDefault: true }],
      });
      if (!cat) {
        cat = await Category.create({
          name: targetName,
          type,
          icon: "tag",
          color: type === "income" ? "#10B981" : "#38BDF8",
          userId: req.user._id,
        });
      }
      resolvedCategoryId = cat._id;
    }

    if (!resolvedCategoryId) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    const txDate = date ? new Date(date) : new Date();
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const parsedAmount = parseFloat(amount);

    // Convert input amount to system base currency (USD) before saving to MongoDB
    const baseAmount = CurrencyService.toBase(parsedAmount, userCurrency);

    const flagMessages = await detectFlags(req.user._id, baseAmount, resolvedCategoryId, txDate, description);

    const finalPaymentMethod = paymentMethod === "Cash" ? "Cash" : "Digital Bank";
    const finalTransactionId = transaction_id || transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const transaction = await Transaction.create({
      userId: req.user._id,
      categoryId: resolvedCategoryId,
      amount: baseAmount,
      type,
      description: description || "",
      date: txDate,
      paymentMethod: finalPaymentMethod,
      transactionId: finalTransactionId,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      isFlagged: flagMessages.length > 0,
      flagReason: flagMessages.join(" "),
      isDeleted: false,
    });

    // Dynamic Trigger: calculate spent and verify budget limits
    if (type === "expense") {
      await updateBudgetSpent(req.user._id, resolvedCategoryId, txDate);
    }

    await invalidateUserCache(req.user._id);

    const populated = await transaction.populate("categoryId", "name icon color type isDefault is_default");
    const responseTx = populated.toObject({ virtuals: true });
    // Convert base currency amount back to user's currency preference for display
    responseTx.amount = CurrencyService.fromBase(populated.amount, userCurrency);
    responseTx.currency = userCurrency;

    res.status(201).json({
      success: true,
      transaction: responseTx,
      flags: flagMessages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }
    const oldCategoryId = transaction.categoryId;
    const oldDate = transaction.date;

    const {
      categoryId,
      category_id,
      amount,
      type,
      description,
      date,
      paymentMethod,
      transactionId,
      transaction_id,
      isRecurring,
      recurringFrequency,
    } = req.body;

    const userCurrency = CurrencyService.getUserCurrency(req.user);

    const newCatId = categoryId || category_id;
    if (newCatId) transaction.categoryId = newCatId;
    if (amount !== undefined) {
      transaction.amount = CurrencyService.toBase(parseFloat(amount), userCurrency);
    }
    if (type) transaction.type = type;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (paymentMethod) transaction.paymentMethod = paymentMethod === "Cash" ? "Cash" : "Digital Bank";
    if (transactionId || transaction_id) transaction.transactionId = transactionId || transaction_id;
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) transaction.recurringFrequency = recurringFrequency;

    await transaction.save();

    // Trigger budget recalculation on relevant categories
    if (transaction.type === "expense") {
      await updateBudgetSpent(req.user._id, oldCategoryId, oldDate);
      if (newCatId && newCatId.toString() !== oldCategoryId.toString()) {
        await updateBudgetSpent(req.user._id, transaction.categoryId, transaction.date);
      }
    }

    await invalidateUserCache(req.user._id);

    const populated = await transaction.populate("categoryId", "name icon color type isDefault is_default");
    const responseTx = populated.toObject({ virtuals: true });
    responseTx.amount = CurrencyService.fromBase(populated.amount, userCurrency);
    responseTx.currency = userCurrency;

    res.json({ success: true, transaction: responseTx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/transactions/:id (Soft-Delete)
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    // Soft delete: keep historical audit trail intact
    transaction.isDeleted = true;
    await transaction.save();

    // Dynamic Trigger: recalculate budget spent after removal
    if (transaction.type === "expense") {
      await updateBudgetSpent(req.user._id, transaction.categoryId, transaction.date);
    }

    await invalidateUserCache(req.user._id);

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

    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const toInsert = [];
    const skipped = [];
    const affectedCategories = new Set();

    for (const row of rows) {
      if (!row.amount || !row.type) {
        skipped.push(row);
        continue;
      }

      let catId = catMap[row.categoryName?.toLowerCase()];
      if (!catId) {
        const fallbackName = row.categoryName ? row.categoryName.trim() : "Miscellaneous";
        const newCat = await Category.create({
          name: fallbackName,
          type: row.type,
          icon: "tag",
          color: row.type === "income" ? "#10B981" : "#64748B",
          userId: req.user._id,
        });
        catId = newCat._id;
        catMap[fallbackName.toLowerCase()] = catId;
      }

      const rawAmount = parseFloat(row.amount);
      const baseAmount = CurrencyService.toBase(rawAmount, userCurrency);
      const txDate = row.date ? new Date(row.date) : new Date();

      toInsert.push({
        userId: req.user._id,
        categoryId: catId,
        amount: baseAmount,
        type: row.type,
        description: row.description || "",
        date: txDate,
        paymentMethod: row.paymentMethod === "Cash" ? "Cash" : "Digital Bank",
        isDeleted: false,
      });

      if (row.type === "expense") {
        affectedCategories.add(catId.toString());
      }
    }

    if (toInsert.length > 0) {
      await Transaction.insertMany(toInsert);
      // Trigger budget recalculation for all affected categories
      for (const catId of affectedCategories) {
        await updateBudgetSpent(req.user._id, catId, new Date());
      }
    }

    await invalidateUserCache(req.user._id);

    res.json({ success: true, imported: toInsert.length, skipped: skipped.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transactions/recent
const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id, isDeleted: false })
      .populate("categoryId", "name icon color type isDefault is_default")
      .sort({ date: -1, createdAt: -1 })
      .limit(6);

    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const formatted = transactions.map((t) => {
      const obj = t.toObject({ virtuals: true });
      obj.amount = CurrencyService.fromBase(t.amount, userCurrency);
      obj.currency = userCurrency;
      return obj;
    });

    res.json({ success: true, transactions: formatted, currency: userCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transactions/dashboard-metrics
const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `campuscoin:user:${userId}:dashboard:${userCurrency}`;

    if (redisClient?.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (err) {
        // Continue to fresh calculation
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Current month totals in base currency (USD)
    const [monthIncome, monthExpense, subscriptions] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, type: "income", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { userId, type: "expense", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Subscription.find({ user_id: userId }),
    ]);

    const baseIncomeTotal = monthIncome[0]?.total || 0;
    let baseExpenseTotal = monthExpense[0]?.total || 0;

    // Add subscription costs to current month
    const currentSubMonth = startOfMonth.getMonth();
    let currentSubsTotal = 0;
    subscriptions.forEach(sub => {
      if (sub.billing_cycle === 'monthly') {
        currentSubsTotal += sub.amount;
      } else if (sub.billing_cycle === 'yearly') {
        const renewDate = new Date(sub.renewal_date);
        if (renewDate.getMonth() === currentSubMonth) {
          currentSubsTotal += sub.amount;
        }
      }
    });
    baseExpenseTotal += currentSubsTotal;

    const baseNetSavings = baseIncomeTotal - baseExpenseTotal;

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

      const baseInc = mInc[0]?.total || 0;
      let baseExp = mExp[0]?.total || 0;

      let subsTotal = 0;
      const mMonth = mStart.getMonth();
      subscriptions.forEach(sub => {
        if (sub.billing_cycle === 'monthly') {
          subsTotal += sub.amount;
        } else if (sub.billing_cycle === 'yearly') {
          const renewDate = new Date(sub.renewal_date);
          if (renewDate.getMonth() === mMonth) {
            subsTotal += sub.amount;
          }
        }
      });
      baseExp += subsTotal;

      sixMonthTrends.push({
        month: mStart.toLocaleString("default", { month: "short" }),
        year: mStart.getFullYear(),
        income: CurrencyService.fromBase(baseInc, userCurrency),
        expense: CurrencyService.fromBase(baseExp, userCurrency),
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

    const formattedCategoryBreakdown = categoryBreakdown.map((item) => ({
      ...item,
      total: CurrencyService.fromBase(item.total, userCurrency),
    }));

    const responseData = {
      success: true,
      currency: userCurrency,
      currentMonth: {
        income: CurrencyService.fromBase(baseIncomeTotal, userCurrency),
        expense: CurrencyService.fromBase(baseExpenseTotal, userCurrency),
        netSavings: CurrencyService.fromBase(baseNetSavings, userCurrency),
      },
      trends: sixMonthTrends,
      categoryBreakdown: formattedCategoryBreakdown,
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
  updateBudgetSpent,
};
