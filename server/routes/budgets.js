const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getBudgets, setBudget, deleteBudget, getBudgetAlerts } = require("../controllers/budgetController");

router.get("/alerts", protect, getBudgetAlerts);
router.get("/", protect, getBudgets);
router.post("/", protect, setBudget);
router.delete("/:id", protect, deleteBudget);

module.exports = router;
