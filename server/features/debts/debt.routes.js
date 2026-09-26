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
const { validate, debtSchema } = require("../../core/validate");

router.get("/", protect, getDebts);
router.post("/", protect, clearUserCache, validate(debtSchema), createDebt);
router.put("/:id", protect, clearUserCache, updateDebt);
router.delete("/:id", protect, clearUserCache, deleteDebt);

module.exports = router;
