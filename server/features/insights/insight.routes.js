const express = require("express");
const router = express.Router();
const {
  getInsights,
  generateInsight,
  toggleBookmark,
  togglePin,
  getDynamicInsight,
  regenerateDynamicInsight
} = require("./insight.controller");
const { protect } = require("../../core/authMiddleware");

router.get("/", protect, getInsights);
router.post("/generate", protect, generateInsight);
router.put("/:id/bookmark", protect, toggleBookmark);
router.put("/:id/pin", protect, togglePin);
router.get("/dynamic", protect, getDynamicInsight);
router.post("/dynamic/regenerate", protect, regenerateDynamicInsight);

module.exports = router;
