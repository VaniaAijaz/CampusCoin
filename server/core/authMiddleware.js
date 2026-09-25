const jwt = require("jsonwebtoken");
const User = require("../features/auth/User.model");
const { AppError } = require("./errors");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError(401, "ERR_AUTH_004", "Not authorized. No session token provided."));
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_super_secret_jwt_key");
    const user = await User.findById(decoded.id).select("-passwordHash -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return next(new AppError(401, "ERR_AUTH_001", "User didn't exist. You may have to sign up."));
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

module.exports = { protect, adminOnly };
