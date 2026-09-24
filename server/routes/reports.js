const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { monthlySummary, byCategory, sixMonths, dailySummary, topCategory } = require("../controllers/reportController");

router.get("/monthly-summary", protect, monthlySummary);
router.get("/by-category", protect, byCategory);
router.get("/six-months", protect, sixMonths);
router.get("/daily", protect, dailySummary);
router.get("/top-category", protect, topCategory);

module.exports = router;
