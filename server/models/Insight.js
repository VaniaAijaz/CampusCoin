const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // First day of month the insight covers
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
    // Categories flagged as above-average spenders this month
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
