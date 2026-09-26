const mongoose = require("mongoose");
const Budget = require("./Budget.model");
const Transaction = require("../transactions/Transaction.model");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");

// Helper: get first day of a month
const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

// GET /api/budgets?month=YYYY-MM
const getBudgets = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const budgets = await Budget.find({ userId: req.user._id, month: monthDate })
      .populate("categoryId", "name icon color type isDefault is_default");

    const userCurrency = CurrencyService.getUserCurrency(req.user);

    // Format budgets into user's preferred currency
    const formattedBudgets = budgets.map((b) => {
      const obj = b.toObject({ virtuals: true });
      const limitConverted = CurrencyService.fromBase(b.limitAmount, userCurrency);
      const spentConverted = CurrencyService.fromBase(b.spentAmount, userCurrency);
      obj.limitAmount = limitConverted;
      obj.limit_amount = limitConverted;
      obj.spentAmount = spentConverted;
      obj.spent_amount = spentConverted;
      obj.currency = userCurrency;
      return obj;
    });

    res.json({ success: true, budgets: formattedBudgets, currency: userCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/budgets
const setBudget = async (req, res) => {
  try {
    const { categoryId, category_id, month, limitAmount, limit_amount, amount } = req.body;
    const targetCategoryId = categoryId || category_id;
    const inputLimit = limitAmount !== undefined ? limitAmount : (limit_amount !== undefined ? limit_amount : amount);

    if (!targetCategoryId || !month || inputLimit === undefined) {
      return res.status(400).json({
        success: false,
        message: "categoryId, month and limit amount are required.",
      });
    }

    const [year, mo] = month.split("-").map(Number);
    const monthDate = new Date(year, mo - 1, 1);
    const endOfMonth = new Date(year, mo, 0, 23, 59, 59);

    const userCurrency = CurrencyService.getUserCurrency(req.user);

    // Convert input limit to base currency (USD) for storage
    const limitInBase = CurrencyService.toBase(Number(inputLimit), userCurrency);

    // Calculate current spent amount in base currency (USD) from non-deleted transactions
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          categoryId: new mongoose.Types.ObjectId(targetCategoryId),
          type: "expense",
          date: { $gte: monthDate, $lte: endOfMonth },
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const spentAmountInBase = result[0]?.total || 0;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, categoryId: targetCategoryId, month: monthDate },
      { limitAmount: limitInBase, spentAmount: spentAmountInBase, alertSent: false },
      { new: true, upsert: true, runValidators: true }
    );

    await invalidateUserCache(req.user._id);

    const populated = await budget.populate("categoryId", "name icon color type isDefault is_default");
    const responseBudget = populated.toObject({ virtuals: true });
    const limitConverted = CurrencyService.fromBase(populated.limitAmount, userCurrency);
    const spentConverted = CurrencyService.fromBase(populated.spentAmount, userCurrency);

    responseBudget.limitAmount = limitConverted;
    responseBudget.limit_amount = limitConverted;
    responseBudget.spentAmount = spentConverted;
    responseBudget.spent_amount = spentConverted;
    responseBudget.currency = userCurrency;

    res.status(201).json({ success: true, budget: responseBudget });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found." });
    await invalidateUserCache(req.user._id);
    res.json({ success: true, message: "Budget removed." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/budgets/alerts — categories near or over budget this month
const getBudgetAlerts = async (req, res) => {
  try {
    const monthDate = firstDayOfMonth(new Date());
    const budgets = await Budget.find({ userId: req.user._id, month: monthDate })
      .populate("categoryId", "name icon color type isDefault is_default");

    const userCurrency = CurrencyService.getUserCurrency(req.user);

    const alerts = budgets
      .filter((b) => b.limitAmount > 0 && b.spentAmount / b.limitAmount >= 0.8)
      .map((b) => {
        const obj = b.toObject({ virtuals: true });
        obj.limitAmount = CurrencyService.fromBase(b.limitAmount, userCurrency);
        obj.limit_amount = obj.limitAmount;
        obj.spentAmount = CurrencyService.fromBase(b.spentAmount, userCurrency);
        obj.spent_amount = obj.spentAmount;
        obj.currency = userCurrency;

        return {
          budget: obj,
          percent: Math.round((b.spentAmount / b.limitAmount) * 100),
          isOver: b.spentAmount >= b.limitAmount,
        };
      });

    res.json({ success: true, alerts, currency: userCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBudgets, setBudget, deleteBudget, getBudgetAlerts };
