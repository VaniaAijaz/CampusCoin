const express = require("express");
const router = express.Router();
const {
  updateCurrencyPreference,
  getUserProfile,
  recordHeartbeat,
  endSession,
} = require("./user.controller");
const { protect } = require("../../core/authMiddleware");
const { validate, currencyPreferenceSchema } = require("../../core/validate");

router.get("/profile", protect, getUserProfile);
router.put("/profile/currency", protect, validate(currencyPreferenceSchema), updateCurrencyPreference);
router.post("/heartbeat", protect, recordHeartbeat);
router.post("/logout-session", protect, endSession);

module.exports = router;
