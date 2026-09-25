const mongoose = require("mongoose");
const Budget = require("./Budget.model");
const Transaction = require("../transactions/Transaction.model");

// Helper: get first day of a month
const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

// GET /api/budgets?month=YYYY-MM
const getBudgets = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const monthDate = new Date(year, month - 1, 1);
    const budgets = await Budget.find({ userId: req.user._id, month: monthDate })
      .populate("categoryId", "name icon color type");
    res.json({ success: true, budgets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/budgets
const setBudget = async (req, res) => {
  try {
    const { categoryId, month, limitAmount } = req.body;
    if (!categoryId || !month || !limitAmount) {
      return res.status(400).json({ success: false, message: "categoryId, month and limitAmount are required." });
    }
    const [year, mo] = month.split("-").map(Number);
    const monthDate = new Date(year, mo - 1, 1);
    const endOfMonth = new Date(year, mo, 0, 23, 59, 59);

    // Calculate current spent amount using aggregation
    const result = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          categoryId: new mongoose.Types.ObjectId(categoryId),
          type: "expense",
          date: { $gte: monthDate, $lte: endOfMonth },
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const spentAmount = result[0]?.total || 0;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, categoryId, month: monthDate },
      { limitAmount: Number(limitAmount), spentAmount, alertSent: false },
      { new: true, upsert: true, runValidators: true }
    );
    const populated = await budget.populate("categoryId", "name icon color type");
    res.status(201).json({ success: true, budget: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found." });
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
      .populate("categoryId", "name icon color type");
    const alerts = budgets
      .filter((b) => b.limitAmount > 0 && b.spentAmount / b.limitAmount >= 0.8)
      .map((b) => ({
        budget: b,
        percent: Math.round((b.spentAmount / b.limitAmount) * 100),
        isOver: b.spentAmount >= b.limitAmount,
      }));
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBudgets, setBudget, deleteBudget, getBudgetAlerts };
