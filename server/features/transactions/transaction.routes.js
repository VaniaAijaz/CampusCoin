const express = require("express");
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importCSV,
  getRecentTransactions,
  getDashboardMetrics,
} = require("./transaction.controller");
const { protect } = require("../../core/authMiddleware");
const { clearUserCache } = require("../../core/cacheMiddleware");

router.get("/", protect, getTransactions);
router.post("/", protect, clearUserCache, createTransaction);
router.get("/recent", protect, getRecentTransactions);
router.get("/dashboard-metrics", protect, getDashboardMetrics);
router.post("/import-csv", protect, clearUserCache, importCSV);
router.put("/:id", protect, clearUserCache, updateTransaction);
router.delete("/:id", protect, clearUserCache, deleteTransaction);

module.exports = router;
