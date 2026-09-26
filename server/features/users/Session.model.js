const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    login_time: {
      type: Date,
      default: Date.now,
      required: true,
    },
    logout_time: {
      type: Date,
      default: null,
    },
    last_ping: {
      type: Date,
      default: Date.now,
    },
    total_minutes_active: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ user_id: 1, is_active: 1, last_ping: -1 });

module.exports = mongoose.model("Session", sessionSchema);
