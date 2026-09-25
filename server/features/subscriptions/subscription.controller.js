const Subscription = require("./Subscription.model");

const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({ next_due_date: 1 });
    res.json({ success: true, subscriptions });
  } catch (err) {
    next(err);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const { service_name, amount, billing_cycle, next_due_date } = req.body;
    const subscription = await Subscription.create({
      user: req.user._id,
      service_name,
      amount,
      billing_cycle,
      next_due_date,
    });
    res.status(201).json({ success: true, subscription });
  } catch (err) {
    next(err);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subscription) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Subscription deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSubscriptions, createSubscription, deleteSubscription };
