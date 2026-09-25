const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service_name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  billing_cycle: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
  },
  next_due_date: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
