const Goal = require("./Goal.model");
const User = require("../auth/User.model");
const Transaction = require("../transactions/Transaction.model");
const Subscription = require("../subscriptions/Subscription.model");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");

const getSavingsSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const userCurrency = CurrencyService.getUserCurrency(user);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [incomeAgg, expenseAgg, subscriptions] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: user._id, type: "income", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: user._id, type: "expense", date: { $gte: startOfMonth, $lte: endOfMonth }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Subscription.find({ user_id: user._id, is_active: true }),
    ]);

    let baseIncome = incomeAgg[0]?.total || 0;
    let baseExpense = expenseAgg[0]?.total || 0;

    const currentSubMonth = startOfMonth.getMonth();
    subscriptions.forEach((sub) => {
      if (sub.billing_cycle === "monthly") {
        baseExpense += sub.amount;
      } else if (sub.billing_cycle === "yearly") {
        const renewDate = new Date(sub.renewal_date);
        if (renewDate.getMonth() === currentSubMonth) {
          baseExpense += sub.amount;
        }
      }
    });

    const totalGrossSavings = Math.max(0, baseIncome - baseExpense);

    // Goal amount set by student
    const goalAmountBase = user.monthlySavingsGoal || 0;
    const currentSavedBase = user.vaultBalance || 0;

    // Remaining goal to be fulfilled
    const remainingGoalBase = Math.max(0, goalAmountBase - currentSavedBase);

    // Overview available balance (deducted by goal allocation)
    const allocatedToGoal = Math.min(totalGrossSavings, goalAmountBase);
    const availableOverviewBalance = Math.max(0, totalGrossSavings - allocatedToGoal);

    const progressPct = goalAmountBase > 0 ? Math.min(100, Math.round((currentSavedBase / goalAmountBase) * 100)) : 0;

    res.json({
      success: true,
      currency: userCurrency,
      summary: {
        totalGrossBalance: CurrencyService.fromBase(totalGrossSavings, userCurrency),
        availableOverviewBalance: CurrencyService.fromBase(availableOverviewBalance, userCurrency),
        goalAmount: CurrencyService.fromBase(goalAmountBase, userCurrency),
        currentSaved: CurrencyService.fromBase(currentSavedBase, userCurrency),
        remainingGoal: CurrencyService.fromBase(remainingGoalBase, userCurrency),
        progressPct,
        monthlyAllowance: CurrencyService.fromBase(user.monthlyAllowanceBaseline || 0, userCurrency),
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateGoalTarget = async (req, res, next) => {
  try {
    const { goalAmount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const userCurrency = CurrencyService.getUserCurrency(user);

    const numGoal = parseFloat(goalAmount);
    if (isNaN(numGoal) || numGoal < 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid goal amount." });
    }

    const baseGoal = CurrencyService.toBase(numGoal, userCurrency);
    user.monthlySavingsGoal = baseGoal;
    await user.save();

    await invalidateUserCache(req.user._id);

    res.json({
      success: true,
      message: "Savings goal target updated successfully.",
      user,
      goalAmount: numGoal,
    });
  } catch (err) {
    next(err);
  }
};

const depositSavings = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const userCurrency = CurrencyService.getUserCurrency(user);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid deposit amount." });
    }

    const baseDeposit = CurrencyService.toBase(numAmount, userCurrency);
    
    // Add to vault balance
    user.vaultBalance = (user.vaultBalance || 0) + baseDeposit;
    await user.save();

    await invalidateUserCache(req.user._id);

    res.json({
      success: true,
      message: `Successfully deposited ${CurrencyService.fromBase(baseDeposit, userCurrency)} to your Savings Vault!`,
      vaultBalance: CurrencyService.fromBase(user.vaultBalance, userCurrency),
      user,
    });
  } catch (err) {
    next(err);
  }
};

const withdrawSavings = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const userCurrency = CurrencyService.getUserCurrency(user);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid withdrawal amount." });
    }

    const baseWithdraw = CurrencyService.toBase(numAmount, userCurrency);
    if (baseWithdraw > (user.vaultBalance || 0)) {
      return res.status(400).json({ success: false, message: "Withdrawal amount exceeds your current saved balance." });
    }

    user.vaultBalance = Math.max(0, (user.vaultBalance || 0) - baseWithdraw);
    await user.save();

    await invalidateUserCache(req.user._id);

    res.json({
      success: true,
      message: `Successfully withdrew ${CurrencyService.fromBase(baseWithdraw, userCurrency)} from your Savings Vault!`,
      vaultBalance: CurrencyService.fromBase(user.vaultBalance, userCurrency),
      user,
    });
  } catch (err) {
    next(err);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ target_date: 1 });
    const userCurrency = CurrencyService.getUserCurrency(req.user);

    const formatted = goals.map((g) => {
      const obj = g.toObject({ virtuals: true });
      obj.target_amount = CurrencyService.fromBase(g.target_amount, userCurrency);
      obj.current_saved = CurrencyService.fromBase(g.current_saved, userCurrency);
      obj.currency = userCurrency;
      return obj;
    });

    res.json({ success: true, goals: formatted, currency: userCurrency });
  } catch (err) {
    next(err);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const { target_name, target_amount, current_saved, target_date } = req.body;
    const userCurrency = CurrencyService.getUserCurrency(req.user);

    const baseTarget = CurrencyService.toBase(target_amount, userCurrency);
    const baseSaved = CurrencyService.toBase(current_saved || 0, userCurrency);

    const goal = await Goal.create({
      user: req.user._id,
      target_name,
      target_amount: baseTarget,
      current_saved: baseSaved,
      target_date,
    });

    await invalidateUserCache(req.user._id);

    const responseGoal = goal.toObject({ virtuals: true });
    responseGoal.target_amount = CurrencyService.fromBase(goal.target_amount, userCurrency);
    responseGoal.current_saved = CurrencyService.fromBase(goal.current_saved, userCurrency);
    responseGoal.currency = userCurrency;

    res.status(201).json({ success: true, goal: responseGoal });
  } catch (err) {
    next(err);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const updateData = { ...req.body };

    if (updateData.target_amount !== undefined) {
      updateData.target_amount = CurrencyService.toBase(updateData.target_amount, userCurrency);
    }
    if (updateData.current_saved !== undefined) {
      updateData.current_saved = CurrencyService.toBase(updateData.current_saved, userCurrency);
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: "Not found" });

    await invalidateUserCache(req.user._id);

    const responseGoal = goal.toObject({ virtuals: true });
    responseGoal.target_amount = CurrencyService.fromBase(goal.target_amount, userCurrency);
    responseGoal.current_saved = CurrencyService.fromBase(goal.current_saved, userCurrency);
    responseGoal.currency = userCurrency;

    res.json({ success: true, goal: responseGoal });
  } catch (err) {
    next(err);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Not found" });
    await invalidateUserCache(req.user._id);
    res.json({ success: true, message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSavingsSummary,
  updateGoalTarget,
  depositSavings,
  withdrawSavings,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};
