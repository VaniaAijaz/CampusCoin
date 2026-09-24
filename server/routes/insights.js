const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getInsights, generateInsight, toggleBookmark, togglePin } = require("../controllers/insightController");

router.get("/", protect, getInsights);
router.post("/generate", protect, generateInsight);
router.put("/:id/bookmark", protect, toggleBookmark);
router.put("/:id/pin", protect, togglePin);

module.exports = router;
