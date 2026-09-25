const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [60, "Category name cannot exceed 60 characters"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Category type is required"],
    },
    icon: {
      type: String,
      default: "tag",
    },
    color: {
      type: String,
      default: "#0118A3",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    // null means it's a system/default category; otherwise belongs to a user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, type: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
