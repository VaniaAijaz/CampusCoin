const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  target_name: {
    type: String,
    required: true,
  },
  target_amount: {
    type: Number,
    required: true,
  },
  current_saved: {
    type: Number,
    default: 0,
  },
  target_date: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model("Goal", goalSchema);
