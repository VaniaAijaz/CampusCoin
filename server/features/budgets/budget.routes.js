const express = require("express");
const router = express.Router();
const {
  getBudgets,
  setBudget,
  deleteBudget,
  getBudgetAlerts,
} = require("./budget.controller");
const { protect } = require("../../core/authMiddleware");
const { clearUserCache } = require("../../core/cacheMiddleware");
const { validate, budgetSchema } = require("../../core/validate");

router.get("/", protect, getBudgets);
router.post("/", protect, clearUserCache, validate(budgetSchema), setBudget);
router.delete("/:id", protect, clearUserCache, deleteBudget);
router.get("/alerts", protect, getBudgetAlerts);

module.exports = router;
