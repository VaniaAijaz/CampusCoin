const express = require("express");
const router = express.Router();
const {
  getSubscriptions,
  createSubscription,
  deleteSubscription,
} = require("./subscription.controller");
const { protect } = require("../../core/authMiddleware");
const { clearUserCache } = require("../../core/cacheMiddleware");

router.get("/", protect, getSubscriptions);
router.post("/", protect, clearUserCache, createSubscription);
router.delete("/:id", protect, clearUserCache, deleteSubscription);

module.exports = router;
