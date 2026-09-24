const User = require("../models/User");
const Category = require("../models/Category");
const bcrypt = require("bcryptjs");

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Allowance", type: "income", icon: "wallet", color: "#0118A3", isDefault: true },
  { name: "Part-time Job", type: "income", icon: "briefcase", color: "#3956BB", isDefault: true },
  { name: "Scholarship", type: "income", icon: "award", color: "#0118A3", isDefault: true },
  { name: "Gift", type: "income", icon: "gift", color: "#B9A572", isDefault: true },
  { name: "Other Income", type: "income", icon: "plus-circle", color: "#6B6D75", isDefault: true },
  // Expense
  { name: "Food", type: "expense", icon: "utensils", color: "#E97B4F", isDefault: true },
  { name: "Transport", type: "expense", icon: "bus", color: "#3956BB", isDefault: true },
  { name: "Hostel/Rent", type: "expense", icon: "home", color: "#9A9CA4", isDefault: true },
  { name: "Academics", type: "expense", icon: "book-open", color: "#0118A3", isDefault: true },
  { name: "Subscriptions", type: "expense", icon: "tv", color: "#B9A572", isDefault: true },
  { name: "Entertainment", type: "expense", icon: "music", color: "#E97B4F", isDefault: true },
  { name: "Miscellaneous", type: "expense", icon: "more-horizontal", color: "#9A9CA4", isDefault: true },
];

const seedAdmin = async () => {
  try {
    const newPassword = process.env.ADMIN_PASSWORD || "CC_Adm!n#2026$x";
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await User.findOneAndUpdate(
      { role: "admin" },
      {
        $setOnInsert: {
          name: "Admin",
          email: process.env.ADMIN_EMAIL || "admin@campuscoin.com",
          role: "admin",
          isActive: true,
        },
        $set: { passwordHash },
      },
      { upsert: true, new: true }
    );
    console.log("Admin user ready");
  } catch (err) {
    console.error("Admin seed error:", err.message);
  }
};

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments({ isDefault: true });
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log("Default categories seeded");
    }
  } catch (err) {
    console.error("Category seed error:", err.message);
  }
};

module.exports = { seedAdmin, seedDefaultCategories };
