const express = require("express");
const router = express.Router();
const {
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
} = require("./auth.controller");
const { protect } = require("../../core/authMiddleware");
const {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  currencyPreferenceSchema,
} = require("../../core/validate");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", validate(resendVerificationSchema), resendVerification);
router.post("/google/login", googleLogin);
router.post("/google/register", googleRegister);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/profile/currency", protect, validate(currencyPreferenceSchema), require("../users/user.controller").updateCurrencyPreference);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/pin-tip/:id", protect, togglePinTip);

module.exports = router;
