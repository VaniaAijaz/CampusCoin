const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["take_action", "save", "grow", "understand"],
      default: "understand",
      index: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true,
    },
    insightType: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    supportingMetrics: {
      currentAmount: Number,
      avgAmount: Number,
      lastMonthAmount: Number,
      diffAmount: Number,
      percentChange: Number,
      budgetLimit: Number,
      spentAmount: Number,
      remainingBudget: Number,
      dailyBurnRate: Number,
      projectedMonthEnd: Number,
      goalTarget: Number,
      goalSaved: Number,
      targetMonths: Number,
      suggestedMonthly: Number,
      currency: { type: String, default: "USD" },
      discretionaryTotal: Number,
      discretionaryCount: Number,
      transactionCount: Number,
      drivers: [
        {
          categoryName: String,
          amount: Number,
          percent: Number,
        },
      ],
      suggestedBudgets: [
        {
          categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
          categoryName: String,
          currentLimit: Number,
          suggestedLimit: Number,
          difference: Number,
        },
      ],
    },
    actionType: {
      type: String,
      enum: [
        "review_spending",
        "set_limit",
        "adjust_budget",
        "create_savings_plan",
        "review_subscriptions",
        "view_spending_drivers",
        "create_emergency_goal",
        "none",
      ],
      default: "none",
    },
    actionPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    relatedCategoryName: {
      type: String,
      default: "",
    },
    isDismissed: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBookmarked: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

insightSchema.index({ userId: 1, isDismissed: 1, priority: 1, generatedAt: -1 });
insightSchema.index({ userId: 1, insightType: 1, relatedCategoryId: 1 });

module.exports = mongoose.model("Insight", insightSchema);
