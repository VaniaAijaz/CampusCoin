const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      alias: "user_id",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      alias: "category_id",
    },
    // Store as YYYY-MM-01 format date (first day of month)
    month: {
      type: Date,
      required: true,
    },
    limitAmount: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0.000001, "Budget limit must be greater than 0"],
      alias: "limit_amount",
    },
    // Computed field — updated on transaction add/edit/delete (stored in base currency USD)
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
      alias: "spent_amount",
    },
    alertSent: {
      type: Boolean,
      default: false,
      alias: "alert_sent",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

budgetSchema.virtual("budget_id").get(function () {
  return this._id;
});

budgetSchema.virtual("created_at").get(function () {
  return this.createdAt;
});

budgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
