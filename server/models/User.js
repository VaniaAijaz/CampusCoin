const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    academicYear: {
      type: String,
      trim: true,
      default: "",
    },
    monthlyAllowanceBaseline: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlySavingsGoal: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    fontSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    pinnedTips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Insight",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
  },
  { timestamps: true }
);

// Remove passwordHash from JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model("User", userSchema);
