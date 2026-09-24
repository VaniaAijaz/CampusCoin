const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importCSV,
  getRecentTransactions,
} = require("../controllers/transactionController");

router.get("/recent", protect, getRecentTransactions);
router.get("/", protect, getTransactions);
router.post("/", protect, createTransaction);
router.post("/import-csv", protect, importCSV);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

module.exports = router;
