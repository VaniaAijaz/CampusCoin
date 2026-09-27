const express = require("express");
const router = express.Router();
const {
  getInsights,
  getDashboardInsights,
  generateInsights,
  dismissInsight,
  toggleBookmark,
  togglePin,
  getForecast,
  applyBudgetAdjustments,
  getDynamicTip,
  regenerateDynamicTip,
} = require("./insight.controller");
const { protect } = require("../../core/authMiddleware");

// All insight endpoints are strictly scoped to the authenticated student
router.get("/", protect, getInsights);
router.get("/dashboard", protect, getDashboardInsights);
router.post("/generate", protect, generateInsights);
router.put("/:id/dismiss", protect, dismissInsight);
router.put("/:id/bookmark", protect, toggleBookmark);
router.put("/:id/pin", protect, togglePin);
router.get("/forecast", protect, getForecast);
router.post("/apply-budgets", protect, applyBudgetAdjustments);
router.get("/dynamic", protect, getDynamicTip);
router.post("/dynamic/regenerate", protect, regenerateDynamicTip);

module.exports = router;
