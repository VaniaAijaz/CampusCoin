const Goal = require("./Goal.model");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");

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

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
