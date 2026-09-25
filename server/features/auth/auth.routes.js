const express = require("express");
const router = express.Router();
const {
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
} = require("./auth.controller");
const { protect } = require("../../core/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/google/login", googleLogin);
router.post("/google/register", googleRegister);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/pin-tip/:id", protect, togglePinTip);

module.exports = router;
