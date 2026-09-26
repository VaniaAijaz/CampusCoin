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
      alias: "password_hash",
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
      alias: "academic_year",
    },
    monthlyAllowanceBaseline: {
      type: Number,
      default: 0,
      min: 0,
      alias: "monthly_allowance_baseline",
    },
    monthlySavingsGoal: {
      type: Number,
      default: 0,
      min: 0,
      alias: "monthly_savings_goal",
    },
    currency_preference: {
      type: String,
      enum: ["USD", "EUR", "PKR"],
      default: "PKR",
    },
    currency: {
      type: String,
      default: "PKR",
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "dark",
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationOtp: String,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Explicit snake_case virtual mappings
userSchema.virtual("user_id").get(function () {
  return this._id;
});

userSchema.virtual("created_at").get(function () {
  return this.createdAt;
});

// Synchronize currency and currency_preference before save
userSchema.pre("save", function (next) {
  if (this.isModified("currency_preference") && !this.isModified("currency")) {
    this.currency = this.currency_preference;
  } else if (this.isModified("currency") && !this.isModified("currency_preference")) {
    this.currency_preference = this.currency;
  }
  next();
});

// Remove passwordHash and sensitive security tokens from JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject({ virtuals: true });
  delete user.passwordHash;
  delete user.password_hash;
  delete user.verificationToken;
  delete user.verificationOtp;
  delete user.verificationExpires;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model("User", userSchema);
