const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been disabled." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admin access required." });
};

module.exports = { protect, adminOnly };
