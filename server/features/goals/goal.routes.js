const express = require("express");
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("./goal.controller");
const { protect } = require("../../core/authMiddleware");
const { clearUserCache } = require("../../core/cacheMiddleware");

router.get("/", protect, getGoals);
router.post("/", protect, clearUserCache, createGoal);
router.put("/:id", protect, clearUserCache, updateGoal);
router.delete("/:id", protect, clearUserCache, deleteGoal);

module.exports = router;
