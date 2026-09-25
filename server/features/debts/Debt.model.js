const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  counterparty_name: {
    type: String,
    required: true,
  },
  direction: {
    type: String,
    enum: ["owed_to_me", "i_owe"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  due_date: {
    type: Date,
  },
  settlement_status: {
    type: String,
    enum: ["pending", "settled"],
    default: "pending",
  }
}, { timestamps: true });

module.exports = mongoose.model("Debt", debtSchema);
