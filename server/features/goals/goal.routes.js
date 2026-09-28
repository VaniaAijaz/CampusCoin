const express = require("express");
const router = express.Router();
const {
  getSavingsSummary,
  updateGoalTarget,
  depositSavings,
  withdrawSavings,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("./goal.controller");
const { protect } = require("../../core/authMiddleware");
const { clearUserCache } = require("../../core/cacheMiddleware");

router.get("/summary", protect, getSavingsSummary);
router.post("/set-goal", protect, clearUserCache, updateGoalTarget);
router.post("/deposit", protect, clearUserCache, depositSavings);
router.post("/withdraw", protect, clearUserCache, withdrawSavings);

router.get("/", protect, getGoals);
router.post("/", protect, clearUserCache, createGoal);
router.put("/:id", protect, clearUserCache, updateGoal);
router.delete("/:id", protect, clearUserCache, deleteGoal);

module.exports = router;

