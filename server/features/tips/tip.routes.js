const express = require("express");
const router = express.Router();
const { getTips, aiCategorize, forecast } = require("./tip.controller");
const { protect } = require("../../core/authMiddleware");

router.get("/", protect, getTips);
router.post("/ai-categorize", protect, aiCategorize);
router.get("/forecast", protect, forecast);

module.exports = router;
