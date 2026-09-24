const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getTips, aiCategorize, forecast } = require("../controllers/tipsController");

router.get("/", protect, getTips);
router.post("/ai-categorize", protect, aiCategorize);
router.get("/forecast", protect, forecast);

module.exports = router;
