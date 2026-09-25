const express = require("express");
const router = express.Router();
const {
  monthlySummary,
  byCategory,
  sixMonths,
  dailySummary,
  topCategory,
} = require("./report.controller");
const { protect } = require("../../core/authMiddleware");

router.get("/monthly-summary", protect, monthlySummary);
router.get("/by-category", protect, byCategory);
router.get("/six-months", protect, sixMonths);
router.get("/daily", protect, dailySummary);
router.get("/top-category", protect, topCategory);

module.exports = router;
