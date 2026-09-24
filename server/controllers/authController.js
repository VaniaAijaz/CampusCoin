const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, academicYear, monthlyAllowanceBaseline, monthlySavingsGoal } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      academicYear: academicYear || "",
      monthlyAllowanceBaseline: monthlyAllowanceBaseline || 0,
      monthlySavingsGoal: monthlySavingsGoal || 0,
    });
    const token = generateToken({ id: user._id, role: user.role });
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been disabled. Contact support." });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken({ id: user._id, role: user.role });
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, academicYear, monthlyAllowanceBaseline, monthlySavingsGoal, currency, theme, fontSize } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, academicYear, monthlyAllowanceBaseline, monthlySavingsGoal, currency, theme, fontSize },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    const user = await User.findById(req.user._id).select("+passwordHash");
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always return success to avoid email enumeration
    if (!user) {
      return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();
    // In production, send email here. For now, return token in response (dev mode)
    res.json({ success: true, message: "Reset link generated.", resetToken: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Reset token is invalid or has expired." });
    }
    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    const token = generateToken({ id: user._id, role: user.role });
    res.json({ success: true, message: "Password reset successful.", token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };
