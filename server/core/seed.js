const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./db");

const User = require("../features/auth/User.model");
const Transaction = require("../features/transactions/Transaction.model");
const Budget = require("../features/budgets/Budget.model");
const Category = require("../features/categories/Category.model");
const Debt = require("../features/debts/Debt.model");
const Subscription = require("../features/subscriptions/Subscription.model");
const Goal = require("../features/goals/Goal.model");
const Announcement = require("../features/admin/Announcement.model");

/**
 * 100% Database Wipe & Clean Seed
 * - Wipes all collections (Users, Transactions, Budgets, Khata/Debts, Categories, Subscriptions, Goals, Announcements, etc.)
 * - Zero Dummy Data: Does NOT insert any fake transactions, categories, or budgets.
 * - Seeds exactly two core accounts with bcrypt-hashed passwords:
 *   1. Admin: admin@campuscoin.pk / admin123
 *   2. Student: student@campuscoin.pk / std123
 */
const wipeAndSeed = async () => {
  try {
    console.log("[SEED] Starting complete database wipe...");

    // 1. Wipe all collections via Mongoose models
    await Promise.all([
      User.deleteMany({}),
      Transaction.deleteMany({}),
      Budget.deleteMany({}),
      Category.deleteMany({}),
      Debt.deleteMany({}),
      Subscription.deleteMany({}),
      Goal.deleteMany({}),
      Announcement.deleteMany({}),
    ]);

    // 2. Also wipe any dynamically registered collections in the active database
    if (mongoose.connection?.collections) {
      const collections = Object.keys(mongoose.connection.collections);
      for (const collName of collections) {
        try {
          await mongoose.connection.collections[collName].deleteMany({});
        } catch {
          // Ignore if collection was already dropped/empty
        }
      }
    }

    console.log("[SEED] Database 100% wiped. Zero dummy records remaining.");

    // 3. Hash passwords securely using bcrypt (12 rounds)
    const adminPasswordHash = await bcrypt.hash("admin123", 12);
    const studentPasswordHash = await bcrypt.hash("std123", 12);

    // 4. Seed Admin Account
    const adminUser = await User.create({
      name: "Campus Coin Admin",
      email: "admin@campuscoin.pk",
      passwordHash: adminPasswordHash,
      role: "admin",
      isVerified: true,
      isActive: true,
      currency_preference: "PKR",
      currency: "PKR",
    });

    // 5. Seed Student Account
    const studentUser = await User.create({
      name: "Campus Student",
      email: "student@campuscoin.pk",
      passwordHash: studentPasswordHash,
      role: "student",
      isVerified: true,
      isActive: true,
      academicYear: "Freshman (Year 1)",
      monthlyAllowanceBaseline: 0,
      monthlySavingsGoal: 0,
      currency_preference: "PKR",
      currency: "PKR",
    });

    console.log("[SEED] Successfully seeded core accounts:");
    console.log(`  - Admin:   ${adminUser.email} (role: ${adminUser.role})`);
    console.log(`  - Student: ${studentUser.email} (role: ${studentUser.role})`);
    console.log("[SEED] Zero dummy transactions, budgets, or categories inserted.");

    return { adminUser, studentUser };
  } catch (err) {
    console.error("[SEED ERROR]:", err);
    throw err;
  }
};

// Standalone execution support: node server/core/seed.js
if (require.main === module) {
  connectDB().then(async (conn) => {
    if (conn) {
      try {
        await wipeAndSeed();
        console.log("[SEED] Execution finished successfully.");
        process.exit(0);
      } catch (e) {
        console.error("[SEED] Failed:", e);
        process.exit(1);
      }
    } else {
      console.error("[SEED] Failed to connect to database.");
      process.exit(1);
    }
  });
}

// Backward-compatible named exports for server.js
const seedAdmin = async () => {
  const existing = await User.findOne({ email: "admin@campuscoin.pk" });
  if (!existing) {
    const hash = await bcrypt.hash("admin123", 12);
    await User.create({
      name: "Campus Coin Admin",
      email: "admin@campuscoin.pk",
      passwordHash: hash,
      role: "admin",
      isVerified: true,
      isActive: true,
      currency_preference: "PKR",
      currency: "PKR",
    });
  }
};

const seedDemoStudent = async () => {
  const existing = await User.findOne({ email: "student@campuscoin.pk" });
  if (!existing) {
    const hash = await bcrypt.hash("std123", 12);
    await User.create({
      name: "Campus Student",
      email: "student@campuscoin.pk",
      passwordHash: hash,
      role: "student",
      isVerified: true,
      isActive: true,
      academicYear: "Freshman (Year 1)",
      monthlyAllowanceBaseline: 0,
      monthlySavingsGoal: 0,
      currency_preference: "PKR",
      currency: "PKR",
    });
  }
};

const seedDefaultCategories = async () => {
  // Zero Dummy Data rule: No automatic seeding of dummy categories
};

module.exports = {
  wipeAndSeed,
  seedAdmin,
  seedDemoStudent,
  seedDefaultCategories,
};
