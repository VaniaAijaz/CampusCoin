const User = require("../models/User");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Announcement = require("../models/Announcement");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalTransactions, categories] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", isActive: true }),
      Transaction.countDocuments({ isDeleted: false }),
      Transaction.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
        { $unwind: "$cat" },
        { $project: { name: "$cat.name", count: 1 } },
      ]),
    ]);
    res.json({ success: true, stats: { totalUsers, activeUsers, totalTransactions, topCategories: categories } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: "student" };
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "admin") {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    await user.deleteOne();
    res.json({ success: true, message: "User deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/categories
const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDefault: true }).sort({ type: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/categories
const createAdminCategory = async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, message: "Name and type required." });
    const category = await Category.create({ name, type, icon: icon || "tag", color: color || "#0118A3", isDefault: true });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/categories/:id
const updateAdminCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/categories/:id
const deleteAdminCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.json({ success: true, message: "Category deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/announcements
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: "Title and message required." });
    const announcement = await Announcement.create({ title, message, type: type || "info", createdBy: req.user._id });
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/announcements/:id
const deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats, getUsers, toggleUser, deleteUser,
  getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
};
