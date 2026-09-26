const jwt = require("jsonwebtoken");
const User = require("../features/auth/User.model");
const { AppError } = require("./errors");

const COOKIE_NAME = "token";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const setTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Primary: Extract from HttpOnly Cookie (XSS Protection)
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }
    // 2. Secondary fallback: Extract from Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError(401, "ERR_AUTH_004", "Not authorized. No session token provided."));
    }

    // Support instant demo mode tokens without rejection
    if (token.startsWith("demo-mock")) {
      let demoUser = await User.findOne({ email: "student@campuscoin.com" }).select("-passwordHash");
      if (!demoUser) {
        demoUser = {
          _id: "demo-student-id",
          name: "Alex Rivera",
          email: "student@campuscoin.com",
          role: "student",
          academicYear: "Junior (Year 3)",
          monthlyAllowanceBaseline: 1500,
          monthlySavingsGoal: 300,
          currency: "USD",
          isVerified: true,
          isActive: true,
        };
      }
      req.user = demoUser;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_super_secret_jwt_key");
    const user = await User.findById(decoded.id).select("-passwordHash -resetPasswordToken -resetPasswordExpires");
    
    if (!user) {
      return next(new AppError(401, "ERR_AUTH_001", "User does not exist. Please sign up."));
    }
    if (!user.isActive) {
      return next(new AppError(403, "ERR_AUTH_006", "Your account has been disabled. Contact support."));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new AppError(401, "ERR_AUTH_005", "Session token expired or invalid."));
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return next(new AppError(403, "ERR_AUTH_006", "Admin access required."));
};

const verifiedOnly = (req, res, next) => {
  if (req.user && (req.user.isVerified || req.user.role === "admin")) return next();
  return next(new AppError(403, "ERR_AUTH_UNVERIFIED", "Please verify your email address to access this feature."));
};

module.exports = {
  protect,
  adminOnly,
  verifiedOnly,
  setTokenCookie,
  clearTokenCookie,
  COOKIE_NAME,
};
