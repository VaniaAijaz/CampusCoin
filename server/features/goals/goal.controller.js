const Goal = require("./Goal.model");

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ target_date: 1 });
    res.json({ success: true, goals });
  } catch (err) {
    next(err);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const { target_name, target_amount, current_saved, target_date } = req.body;
    const goal = await Goal.create({
      user: req.user._id,
      target_name,
      target_amount,
      current_saved,
      target_date,
    });
    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Goal deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
