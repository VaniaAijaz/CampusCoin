const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Category = require("../models/Category");

// Helper: update budget spent amount
const updateBudgetSpent = async (userId, categoryId, month) => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  const result = await Transaction.aggregate([
    {
      $match: {
        userId,
        categoryId,
        type: "expense",
        date: { $gte: startOfMonth, $lte: endOfMonth },
        isDeleted: false,
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const total = result[0]?.total || 0;
  await Budget.findOneAndUpdate(
    { userId, categoryId, month: startOfMonth },
    { spentAmount: total },
    { new: true }
  );
};

// Detect unusually large or duplicate transactions
const detectFlags = async (userId, amount, categoryId, date, description) => {
  const flags = [];
  // Check for duplicate (same amount + category + description within 2 minutes)
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

  // Check if amount is 3x the user's average for this category
  const stats = await Transaction.aggregate([
    { $match: { userId, categoryId, type: "expense", isDeleted: false } },
    { $group: { _id: null, avg: { $avg: "$amount" } } },
  ]);
  if (stats[0]?.avg && amount > stats[0].avg * 3) {
    flags.push(`Unusually large amount (avg: ${stats[0].avg.toFixed(2)}).`);
  }
  return flags;
};

// GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const { type, categoryId, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (categoryId) filter.categoryId = categoryId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    if (search) filter.description = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("categoryId", "name icon color type")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);
    res.json({ success: true, transactions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
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
    const flagMessages = await detectFlags(req.user._id, amount, categoryId, txDate, description);

    const transaction = await Transaction.create({
      userId: req.user._id,
      categoryId,
      amount,
      type,
      description: description || "",
      date: txDate,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      isFlagged: flagMessages.length > 0,
      flagReason: flagMessages.join(" "),
    });

    // Update budget if expense
    if (type === "expense") {
      await updateBudgetSpent(req.user._id, categoryId, txDate);
    }

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
    if (amount) transaction.amount = amount;
    if (type) transaction.type = type;
    if (description !== undefined) transaction.description = description;
    if (date) transaction.date = new Date(date);
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) transaction.recurringFrequency = recurringFrequency;

    await transaction.save();

    // Recalculate budgets for old and new category
    if (transaction.type === "expense") {
      await updateBudgetSpent(req.user._id, oldCategoryId, oldDate);
      if (categoryId && categoryId !== String(oldCategoryId)) {
        await updateBudgetSpent(req.user._id, transaction.categoryId, transaction.date);
      }
    }

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
    res.json({ success: true, message: "Transaction deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transactions/import-csv
const importCSV = async (req, res) => {
  try {
    const { rows } = req.body; // Array of { date, description, amount, type, categoryName }
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
    res.json({ success: true, imported: toInsert.length, skipped: skipped.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transactions/recent
const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate("categoryId", "name icon color type")
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, importCSV, getRecentTransactions };
