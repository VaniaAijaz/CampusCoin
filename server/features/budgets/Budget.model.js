const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Store as YYYY-MM-01 format date (first day of month)
    month: {
      type: Date,
      required: true,
    },
    limitAmount: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0.01, "Budget limit must be greater than 0"],
    },
    // Computed field — updated on transaction add/edit/delete
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    alertSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
