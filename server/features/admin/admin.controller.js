const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../auth/User.model");
const Category = require("../categories/Category.model");
const Transaction = require("../transactions/Transaction.model");
const Announcement = require("./Announcement.model");
const Session = require("../users/Session.model");
const generateToken = require("../../core/generateToken");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalTransactions, categories, sessionStats] = await Promise.all([
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
      Session.aggregate([
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: "$total_minutes_active" },
            avgMinutes: { $avg: "$total_minutes_active" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const avgMinutes = sessionStats.length > 0 && sessionStats[0].avgMinutes
      ? Math.round(sessionStats[0].avgMinutes * 10) / 10
      : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalTransactions,
        topCategories: categories,
        averageUserSessionTime: avgMinutes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/users
// Securely returns metadata and system usage stats only (NO passwords, NO raw financial totals)
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { role: "student" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password_hash -password -monthlyAllowanceBaseline -monthlySavingsGoal")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Aggregate transactions count and session active time for each user
    const [txAgg, sessionAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: { $in: userIds }, isDeleted: false } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
      Session.aggregate([
        { $match: { user_id: { $in: userIds } } },
        {
          $group: {
            _id: "$user_id",
            totalMinutes: { $sum: "$total_minutes_active" },
            avgMinutes: { $avg: "$total_minutes_active" },
            sessionCount: { $sum: 1 },
          },
        },
      ]),
      Session.aggregate([
        { $match: { user_id: { $in: userIds }, login_time: { $gte: startOfToday } } },
        {
          $group: {
            _id: "$user_id",
            todayMinutes: { $sum: "$total_minutes_active" }
          },
        },
      ]),
    ]);

    const txMap = new Map(txAgg.map((t) => [t._id.toString(), t.count]));
    const sessionMap = new Map(sessionAgg.map((s) => [s._id.toString(), s]));
    const todayMap = new Map(todaySessionAgg.map((s) => [s._id.toString(), s]));

    const enrichedUsers = users.map((u) => {
      const uId = u._id.toString();
      const txCount = txMap.get(uId) || 0;
      const sData = sessionMap.get(uId);
      const todayData = todayMap.get(uId);

      const totalMinutes = sData ? Math.round(sData.totalMinutes * 10) / 10 : 0;
      const avgMinutes = sData ? Math.round(sData.avgMinutes * 10) / 10 : 0;
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      
      const todayMinutes = todayData ? Math.round(todayData.todayMinutes * 10) / 10 : 0;
      const todayHours = Math.round((todayMinutes / 60) * 10) / 10;

      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        academicYear: u.academicYear,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        total_transactions: txCount,
        average_session_minutes: avgMinutes,
        total_hours_used: totalHours,
        total_minutes_active: totalMinutes,
        today_minutes_active: todayMinutes,
        today_hours_active: todayHours,
      };
    });

    res.json({ success: true, users: enrichedUsers, total });
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

// POST /api/admin/users/:id/reset-link
// Generates a secure reset token for that specific user and returns formatted reset link
const generateResetLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Student account not found." });
    }

    // Generate cryptographic reset token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour validity
    await user.save();

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    res.json({
      success: true,
      message: `Password reset link generated for ${user.name}.`,
      token,
      resetUrl,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
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
    const announcements = await Announcement.find()
      .populate("created_by_admin_id", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, priority } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: "Title and message required." });
    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      type: type || "info",
      priority: priority || "medium",
      createdBy: req.user._id,
      created_by_admin_id: req.user._id,
    });
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/announcements/:id
const updateAnnouncement = async (req, res) => {
  try {
    const { title, message, priority, type, isActive } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(message !== undefined && { message: message.trim() }),
        ...(priority !== undefined && { priority }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found." });
    res.json({ success: true, announcement });
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
};
