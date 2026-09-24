const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
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
      required: [true, "Category is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Transaction type is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    // AI-suggested category (category id as string, overridable)
    aiSuggestedCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    // Whether the AI suggestion was accepted or overridden
    aiSuggestionAccepted: {
      type: Boolean,
      default: null,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", null],
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Only return non-deleted transactions by default
transactionSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
