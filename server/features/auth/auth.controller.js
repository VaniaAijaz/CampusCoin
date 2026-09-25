const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("./User.model");
const generateToken = require("../../core/generateToken");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../emails/email.service");
const { AppError } = require("../../core/errors");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, academicYear, monthlyAllowanceBaseline, monthlySavingsGoal } = req.body;
    if (!name || !email || !password) {
      return next(new AppError(400, "ERR_AUTH_002", "Name, email and password are required."));
    }
    if (password.length < 6) {
      return next(new AppError(400, "ERR_AUTH_002", "Password must be at least 6 characters."));
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return next(new AppError(409, "ERR_AUTH_002", "An account with this email already exists."));
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
    
    // Fire-and-forget welcome email
    sendWelcomeEmail(user.email, user.name).catch(console.error);
    
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError(400, "ERR_AUTH_003", "Email and password are required."));
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new AppError(401, "ERR_AUTH_003", "Invalid email or password."));
    }
    if (!user.isActive) {
      return next(new AppError(403, "ERR_AUTH_006", "Your account has been disabled. Contact support."));
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError(401, "ERR_AUTH_003", "Invalid email or password."));
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken({ id: user._id, role: user.role });
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

const admin = require("../../core/firebaseAdmin");

// POST /api/auth/google/login
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return next(new AppError(400, "ERR_AUTH_004", "No ID token provided."));
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email.toLowerCase();
    
    const user = await User.findOne({ email });
    if (!user) {
      // Standardized contract ERR_AUTH_001
      return next(new AppError(404, "ERR_AUTH_001", "User didn't exist. You may have to sign up."));
    }
    
    if (!user.isActive) {
      return next(new AppError(403, "ERR_AUTH_006", "Your account has been disabled. Contact support."));
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken({ id: user._id, role: user.role });
    res.json({ success: true, token, user });
  } catch (err) {
    next(new AppError(401, "ERR_AUTH_005", "Firebase token verification failed."));
  }
};

// POST /api/auth/google/register
const googleRegister = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return next(new AppError(400, "ERR_AUTH_004", "No ID token provided."));
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email.toLowerCase();
    const name = decodedToken.name || "Student";
    
    const exists = await User.findOne({ email });
    if (exists) {
      return next(new AppError(409, "ERR_AUTH_002", "Account already exists. Please log in."));
    }
    
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 12);
    
    const user = await User.create({
      name,
      email,
      passwordHash,
      academicYear: "",
      monthlyAllowanceBaseline: 0,
      monthlySavingsGoal: 0,
    });
    
    const token = generateToken({ id: user._id, role: user.role });
    
    // Fire-and-forget welcome email
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(new AppError(401, "ERR_AUTH_005", "Firebase token verification failed."));
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, academicYear, monthlyAllowanceBaseline, monthlySavingsGoal, currency, theme, fontSize } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, academicYear, monthlyAllowanceBaseline, monthlySavingsGoal, currency, theme, fontSize },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError(400, "ERR_AUTH_002", "Both current and new password are required."));
    }
    if (newPassword.length < 6) {
      return next(new AppError(400, "ERR_AUTH_002", "New password must be at least 6 characters."));
    }
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return next(new AppError(401, "ERR_AUTH_003", "Current password is incorrect."));
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError(400, "ERR_AUTH_002", "Email is required."));
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: "If that email is registered, a reset link will be sent." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`;
    sendPasswordResetEmail(user.email, token).catch(console.error);

    res.json({ success: true, message: "Password reset instructions created.", resetUrl, token });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return next(new AppError(400, "ERR_AUTH_007", "Password reset token is invalid or has expired."));
    }
    const { password } = req.body;
    if (!password || password.length < 6) {
      return next(new AppError(400, "ERR_AUTH_002", "Password must be at least 6 characters."));
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/pin-tip/:id
const togglePinTip = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const tipId = req.params.id;
    const idx = user.pinnedTips.indexOf(tipId);
    if (idx === -1) {
      user.pinnedTips.push(tipId);
    } else {
      user.pinnedTips.splice(idx, 1);
    }
    await user.save();
    res.json({ success: true, pinnedTips: user.pinnedTips });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  googleRegister,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  togglePinTip,
};
