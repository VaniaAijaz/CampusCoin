const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("./User.model");
const generateToken = require("../../core/generateToken");
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } = require("../emails/email.service");
const { AppError } = require("../../core/errors");
const { setTokenCookie, clearTokenCookie } = require("../../core/authMiddleware");
const CurrencyService = require("../../core/currency.service");
const { invalidateUserCache } = require("../../core/cacheMiddleware");

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
    
    // Generate 6-digit numeric OTP and hex link token
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const verificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      academicYear: academicYear || "",
      monthlyAllowanceBaseline: monthlyAllowanceBaseline || 0,
      monthlySavingsGoal: monthlySavingsGoal || 0,
      isVerified: false,
      verificationToken,
      verificationOtp,
      verificationExpires,
    });

    const token = generateToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);
    
    // Dispatch verification email with OTP and direct link
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyLink = `${clientUrl}/app/verify?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    sendVerificationEmail(user.email, user.name, verificationOtp, verifyLink).catch(console.error);

    res.status(201).json({
      success: true,
      token,
      user,
      requiresVerification: true,
      message: "Registration successful. Please verify your email using the OTP sent to your inbox.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { token, otp, email } = req.body;

    let user = null;

    if (token) {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpires: { $gt: Date.now() },
      });
    } else if (otp && email) {
      user = await User.findOne({
        email: email.toLowerCase(),
        verificationOtp: otp.toString().trim(),
        verificationExpires: { $gt: Date.now() },
      });
    } else {
      return next(new AppError(400, "ERR_AUTH_002", "Provide either a verification link token or 6-digit OTP code with email."));
    }

    if (!user) {
      return next(new AppError(400, "ERR_AUTH_007", "Invalid or expired verification code or link."));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationOtp = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const freshToken = generateToken({ id: user._id, role: user.role });
    setTokenCookie(res, freshToken);

    // Send welcome email once verified
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.json({
      success: true,
      token: freshToken,
      user,
      message: "Email successfully verified! Welcome to Campus Coin.",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const email = req.body.email || req.user?.email;
    if (!email) {
      return next(new AppError(400, "ERR_AUTH_002", "Email is required to resend verification."));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new AppError(404, "ERR_AUTH_001", "No account associated with that email address."));
    }

    if (user.isVerified) {
      return res.json({ success: true, message: "Your email is already verified. You may proceed to the dashboard." });
    }

    // Refresh OTP and verification token
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.verificationOtp = verificationOtp;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyLink = `${clientUrl}/app/verify?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    await sendVerificationEmail(user.email, user.name, verificationOtp, verifyLink);

    res.json({
      success: true,
      message: "A new 6-digit verification code has been dispatched to your email address.",
    });
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
    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    // Auto-create seeded core users if missing in local/remote DB
    if (!user) {
      if (cleanEmail === "student@campuscoin.pk" || cleanEmail === "student@campuscoin.com") {
        const hash = await bcrypt.hash("std123", 12);
        user = await User.create({
          name: "Campus Student",
          email: cleanEmail,
          role: "student",
          passwordHash: hash,
          isVerified: true,
          isActive: true,
          academicYear: "Freshman (Year 1)",
          monthlyAllowanceBaseline: 0,
          monthlySavingsGoal: 0,
          currency: "PKR",
          currency_preference: "PKR",
        });
      } else if (cleanEmail === "admin@campuscoin.pk" || cleanEmail === "admin@campuscoin.com") {
        const hash = await bcrypt.hash("admin123", 12);
        user = await User.create({
          name: "Campus Coin Admin",
          email: cleanEmail,
          role: "admin",
          passwordHash: hash,
          isVerified: true,
          isActive: true,
          currency: "PKR",
          currency_preference: "PKR",
        });
      } else {
        return next(new AppError(401, "ERR_AUTH_003", "Invalid email or password."));
      }
    }

    if (!user.isActive) {
      return next(new AppError(403, "ERR_AUTH_006", "Your account has been disabled. Contact support."));
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Support known demo password variations
      const isDemoStudent = (cleanEmail === "student@campuscoin.pk" || cleanEmail === "student@campuscoin.com") && ["std123", "Student@123", "student123", "demo123"].includes(password);
      const isDemoAdmin = (cleanEmail === "admin@campuscoin.pk" || cleanEmail === "admin@campuscoin.com") && ["admin123", "Admin@123", "demo123"].includes(password);
      if (isDemoStudent || isDemoAdmin) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return next(new AppError(401, "ERR_AUTH_003", "Invalid email or password."));
    }

    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: "Logged out successfully." });
};

const admin = require("../../core/firebaseAdmin");

const verifyGoogleToken = async (idToken) => {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (fbErr) {
    console.warn("[FIREBASE ADMIN] verifyIdToken failed, attempting Google tokeninfo fallback:", fbErr.message);
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          email: data.email,
          name: data.name || (data.email ? data.email.split("@")[0] : "Student"),
          uid: data.sub,
          email_verified: data.email_verified === "true" || data.email_verified === true,
        };
      }
      throw new Error(`Google tokeninfo endpoint returned status: ${response.status}`);
    } catch (tokenInfoErr) {
      console.error("[AUTH ERROR] All Google token verification methods failed:", tokenInfoErr.message);
      throw fbErr;
    }
  }
};

// POST /api/auth/google/login
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return next(new AppError(400, "ERR_AUTH_004", "No ID token provided."));
    
    // Verify Firebase token with resilient Google OAuth fallback
    const decodedToken = await verifyGoogleToken(idToken);
    if (!decodedToken?.email) {
      return next(new AppError(401, "ERR_AUTH_005", "No verified email associated with this Google account."));
    }
    const email = decodedToken.email.toLowerCase();
    
    let user = await User.findOne({ email });
    if (!user) {
      // Seamlessly auto-register user on first Google login!
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      user = await User.create({
        name: decodedToken.name || "Student",
        email,
        passwordHash,
        isVerified: true,
        academicYear: "Freshman (Year 1)",
        monthlyAllowanceBaseline: 1000,
        monthlySavingsGoal: 200,
        currency: "USD",
        isActive: true,
      });
      sendWelcomeEmail(user.email, user.name).catch(console.error);
    }
    
    if (!user.isActive) {
      return next(new AppError(403, "ERR_AUTH_006", "Your account has been disabled. Contact support."));
    }

    if (!user.isVerified) {
      user.isVerified = true;
    }
    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);
    res.json({ success: true, token, user });
  } catch (err) {
    console.error("[AUTH ERROR] Google login failure:", err);
    next(new AppError(401, "ERR_AUTH_005", err.message || "Google authentication failed. Please try again."));
  }
};

// POST /api/auth/google/register
const googleRegister = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return next(new AppError(400, "ERR_AUTH_004", "No ID token provided."));
    
    // Verify Firebase token with resilient Google OAuth fallback
    const decodedToken = await verifyGoogleToken(idToken);
    if (!decodedToken?.email) {
      return next(new AppError(401, "ERR_AUTH_005", "No verified email associated with this Google account."));
    }
    const email = decodedToken.email.toLowerCase();
    const name = decodedToken.name || "Student";
    
    let user = await User.findOne({ email });
    if (user) {
      // Seamlessly sign in existing Google account
      user.lastLogin = new Date();
      if (!user.isVerified) user.isVerified = true;
      await user.save();
      const token = generateToken({ id: user._id, role: user.role });
      setTokenCookie(res, token);
      return res.json({ success: true, token, user });
    }
    
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 12);
    
    user = await User.create({
      name,
      email,
      passwordHash,
      isVerified: true,
      academicYear: "Freshman (Year 1)",
      monthlyAllowanceBaseline: 1000,
      monthlySavingsGoal: 200,
      currency: "USD",
      isActive: true,
    });
    
    const token = generateToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);
    
    // Fire-and-forget welcome email
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error("[AUTH ERROR] Google register failure:", err);
    next(new AppError(401, "ERR_AUTH_005", err.message || "Google registration failed. Please try again."));
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      academicYear,
      academic_year,
      monthlyAllowanceBaseline,
      monthlySavingsGoal,
      monthly_savings_goal,
      currency,
      currency_preference,
      theme,
      fontSize,
    } = req.body;

    const chosenCurrency = currency_preference || currency;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (academicYear !== undefined) updateData.academicYear = academicYear;
    if (academic_year !== undefined) updateData.academicYear = academic_year;
    if (monthlyAllowanceBaseline !== undefined) updateData.monthlyAllowanceBaseline = monthlyAllowanceBaseline;
    if (monthlySavingsGoal !== undefined) updateData.monthlySavingsGoal = monthlySavingsGoal;
    if (monthly_savings_goal !== undefined) updateData.monthlySavingsGoal = monthly_savings_goal;
    if (theme !== undefined) updateData.theme = theme;
    if (fontSize !== undefined) updateData.fontSize = fontSize;

    if (chosenCurrency && CurrencyService.isValidCurrency(chosenCurrency)) {
      const normalized = chosenCurrency.toUpperCase().trim();
      updateData.currency_preference = normalized;
      updateData.currency = normalized;
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (chosenCurrency) {
      await invalidateUserCache(req.user._id);
    }

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
  logout,
  verifyEmail,
  resendVerification,
  googleLogin,
  googleRegister,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  togglePinTip,
};
