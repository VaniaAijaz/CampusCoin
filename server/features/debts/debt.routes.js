const express = require("express");
const router = express.Router();
const {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
} = require("./debt.controller");
const { protect } = require("../../core/authMiddleware");
const { clearUserCache } = require("../../core/cacheMiddleware");

router.get("/", protect, getDebts);
router.post("/", protect, clearUserCache, createDebt);
router.put("/:id", protect, clearUserCache, updateDebt);
router.delete("/:id", protect, clearUserCache, deleteDebt);

module.exports = router;
