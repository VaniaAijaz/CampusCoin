const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  toggleUser,
  deleteUser,
  generateResetLink,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("./admin.controller");
const { protect, adminOnly } = require("../../core/authMiddleware");

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/toggle", toggleUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/reset-link", generateResetLink);

router.get("/categories", getAdminCategories);
router.post("/categories", createAdminCategory);
router.put("/categories/:id", updateAdminCategory);
router.delete("/categories/:id", deleteAdminCategory);

router.get("/announcements", getAnnouncements);
router.post("/announcements", createAnnouncement);
router.put("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

module.exports = router;
