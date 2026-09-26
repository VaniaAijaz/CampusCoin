const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "USD",
  },
  billing_cycle: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
  },
  renewal_date: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
