const express = require("express");
const router = express.Router();
const {
  updateCurrencyPreference,
  getUserProfile,
  recordHeartbeat,
  endSession,
  getMembershipStatus,
  upgradeToPremium,
  cancelPremium,
} = require("./user.controller");
const { protect } = require("../../core/authMiddleware");
const { validate, currencyPreferenceSchema } = require("../../core/validate");

router.get("/profile", protect, getUserProfile);
router.put("/profile/currency", protect, validate(currencyPreferenceSchema), updateCurrencyPreference);
router.post("/heartbeat", protect, recordHeartbeat);
router.post("/logout-session", protect, endSession);

// Monetization & Subscription Tiers (Free vs Premium)
router.get("/membership", protect, getMembershipStatus);
router.post("/upgrade-premium", protect, upgradeToPremium);
router.post("/cancel-premium", protect, cancelPremium);

module.exports = router;
