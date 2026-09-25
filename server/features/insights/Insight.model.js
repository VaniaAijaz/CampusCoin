const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: Date,
      required: true,
    },
    summaryText: {
      type: String,
      required: true,
    },
    tipText: {
      type: String,
      default: "",
    },
    actionableAdvice: [
      {
        title: String,
        action: String,
        impact: String,
        urgency: { type: String, enum: ["low", "medium", "high"], default: "medium" },
      },
    ],
    spendingVelocity: {
      dailyBurnRate: Number,
      projectedMonthEndExpense: Number,
      velocityStatus: { type: String, enum: ["safe", "caution", "danger"], default: "safe" },
    },
    flaggedCategories: [
      {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        categoryName: String,
        currentAmount: Number,
        avgAmount: Number,
        percentChange: Number,
      },
    ],
    isBookmarked: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

insightSchema.index({ userId: 1, month: -1 });

module.exports = mongoose.model("Insight", insightSchema);
