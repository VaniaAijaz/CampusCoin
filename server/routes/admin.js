const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getStats, getUsers, toggleUser, deleteUser,
  getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
} = require("../controllers/adminController");

router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/toggle", toggleUser);
router.delete("/users/:id", deleteUser);
router.get("/categories", getAdminCategories);
router.post("/categories", createAdminCategory);
router.put("/categories/:id", updateAdminCategory);
router.delete("/categories/:id", deleteAdminCategory);
router.get("/announcements", getAnnouncements);
router.post("/announcements", createAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

module.exports = router;
