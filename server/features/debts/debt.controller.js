const Debt = require("./Debt.model");

const getDebts = async (req, res, next) => {
  try {
    const debts = await Debt.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, debts });
  } catch (err) {
    next(err);
  }
};

const createDebt = async (req, res, next) => {
  try {
    const { counterparty_name, direction, amount, due_date } = req.body;
    const debt = await Debt.create({
      user: req.user._id,
      counterparty_name,
      direction,
      amount,
      due_date,
    });
    res.status(201).json({ success: true, debt });
  } catch (err) {
    next(err);
  }
};

const updateDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!debt) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, debt });
  } catch (err) {
    next(err);
  }
};

const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!debt) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Debt deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDebts, createDebt, updateDebt, deleteDebt };
