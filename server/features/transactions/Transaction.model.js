const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
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
      required: [true, "Category is required"],
      index: true,
      alias: "category_id",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.000001, "Amount must be greater than 0"],
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
    paymentMethod: {
      type: String,
      enum: ["Cash", "Digital Bank", "Digital"],
      default: "Digital Bank",
      required: true,
    },
    transactionId: {
      type: String,
      default: () => `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      index: true,
      alias: "transaction_id",
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
      alias: "is_deleted",
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for explicit snake_case compatibility
transactionSchema.virtual("created_at").get(function () {
  return this.createdAt;
});

// Sanitize paymentMethod and ensure transactionId is set prior to save
transactionSchema.pre("save", function (next) {
  if (this.paymentMethod === "Digital") {
    this.paymentMethod = "Digital Bank";
  }
  if (!this.transactionId) {
    this.transactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

// Exclude soft-deleted transactions by default in find queries
transactionSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, isDeleted: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
