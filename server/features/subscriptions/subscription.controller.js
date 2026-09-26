const Subscription = require("./Subscription.model");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");
const { redisClient } = require("../../core/redis");

const getSubscriptions = async (req, res, next) => {
  try {
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const cacheKey = `campuscoin:user:${req.user._id}:subscriptions:${userCurrency}`;

    if (redisClient?.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) return res.json(JSON.parse(cached));
      } catch (err) {}
    }

    const subscriptions = await Subscription.find({ user_id: req.user._id }).sort({ renewal_date: 1 });

    const formatted = subscriptions.map((s) => {
      const obj = s.toObject({ virtuals: true });
      obj.amount = CurrencyService.fromBase(s.amount, userCurrency);
      obj.currency = userCurrency; // overriding for the display
      return obj;
    });

    const responseData = { success: true, subscriptions: formatted, currency: userCurrency };
    
    if (redisClient?.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
      } catch (err) {}
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const { name, amount, currency, billing_cycle, renewal_date } = req.body;
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const subCurrency = currency || userCurrency;
    
    // In CampusCoin, all amounts are saved in a base currency (like USD).
    // The CurrencyService handles this.
    // If the user inputs an amount in subCurrency, we convert it to base:
    // Wait, the existing code: const baseAmount = CurrencyService.toBase(amount, userCurrency);
    const baseAmount = CurrencyService.toBase(amount, subCurrency);

    const subscription = await Subscription.create({
      user_id: req.user._id,
      name,
      amount: baseAmount,
      currency: subCurrency,
      billing_cycle,
      renewal_date,
    });

    await invalidateUserCache(req.user._id);

    const responseSub = subscription.toObject({ virtuals: true });
    responseSub.amount = CurrencyService.fromBase(subscription.amount, userCurrency);
    responseSub.currency = userCurrency;

    res.status(201).json({ success: true, subscription: responseSub });
  } catch (err) {
    next(err);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!subscription) return res.status(404).json({ success: false, message: "Not found" });
    await invalidateUserCache(req.user._id);
    res.json({ success: true, message: "Subscription deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSubscriptions, createSubscription, deleteSubscription };
