const Debt = require("./Debt.model");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");

// GET /api/debts (Khata / IOU)
const getDebts = async (req, res, next) => {
  try {
    const debts = await Debt.find({ user: req.user._id }).sort({ createdAt: -1 });
    const userCurrency = CurrencyService.getUserCurrency(req.user);

    // Convert stored base currency (USD) amounts into user's currency preference
    const formattedDebts = debts.map((d) => {
      const obj = d.toObject({ virtuals: true });
      obj.amount = CurrencyService.fromBase(d.amount, userCurrency);
      obj.currency = userCurrency;
      return obj;
    });

    res.json({ success: true, debts: formattedDebts, currency: userCurrency });
  } catch (err) {
    next(err);
  }
};

// POST /api/debts
const createDebt = async (req, res, next) => {
  try {
    const { counterparty_name, direction, amount, due_date, settlement_status } = req.body;
    const userCurrency = CurrencyService.getUserCurrency(req.user);

    // Convert input amount to base currency (USD) before storing
    const baseAmount = CurrencyService.toBase(amount, userCurrency);

    const debt = await Debt.create({
      user: req.user._id,
      counterparty_name: counterparty_name.trim(),
      direction,
      amount: baseAmount,
      due_date: due_date || null,
      settlement_status: settlement_status || "pending",
    });

    await invalidateUserCache(req.user._id);

    const responseDebt = debt.toObject({ virtuals: true });
    responseDebt.amount = CurrencyService.fromBase(debt.amount, userCurrency);
    responseDebt.currency = userCurrency;

    res.status(201).json({ success: true, debt: responseDebt });
  } catch (err) {
    next(err);
  }
};

// PUT /api/debts/:id
const updateDebt = async (req, res, next) => {
  try {
    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const updateData = { ...req.body };

    if (updateData.amount !== undefined) {
      updateData.amount = CurrencyService.toBase(updateData.amount, userCurrency);
    }
    if (updateData.counterparty_name) {
      updateData.counterparty_name = updateData.counterparty_name.trim();
    }

    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });

    await invalidateUserCache(req.user._id);

    const responseDebt = debt.toObject({ virtuals: true });
    responseDebt.amount = CurrencyService.fromBase(debt.amount, userCurrency);
    responseDebt.currency = userCurrency;

    res.json({ success: true, debt: responseDebt });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/debts/:id
const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ success: false, message: "Debt not found" });

    await invalidateUserCache(req.user._id);

    res.json({ success: true, message: "Debt record deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDebts, createDebt, updateDebt, deleteDebt };
