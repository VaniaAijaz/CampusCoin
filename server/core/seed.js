const bcrypt = require("bcryptjs");
const User = require("../features/auth/User.model");
const Category = require("../features/categories/Category.model");

const DEFAULT_CATEGORIES = [
  // Income
  { name: "Allowance", type: "income", icon: "wallet", color: "#6366F1", isDefault: true },
  { name: "Part-time Job", type: "income", icon: "briefcase", color: "#3B82F6", isDefault: true },
  { name: "Scholarship", type: "income", icon: "award", color: "#10B981", isDefault: true },
  { name: "Gift", type: "income", icon: "gift", color: "#F59E0B", isDefault: true },
  { name: "Other Income", type: "income", icon: "plus-circle", color: "#8B5CF6", isDefault: true },
  // Expense
  { name: "Food", type: "expense", icon: "utensils", color: "#F97316", isDefault: true },
  { name: "Transport", type: "expense", icon: "bus", color: "#06B6D4", isDefault: true },
  { name: "Hostel/Rent", type: "expense", icon: "home", color: "#64748B", isDefault: true },
  { name: "Academics", type: "expense", icon: "book-open", color: "#6366F1", isDefault: true },
  { name: "Subscriptions", type: "expense", icon: "tv", color: "#EC4899", isDefault: true },
  { name: "Entertainment", type: "expense", icon: "music", color: "#A855F7", isDefault: true },
  { name: "Miscellaneous", type: "expense", icon: "more-horizontal", color: "#71717A", isDefault: true },
];

const seedSampleRecords = async (userId) => {
  const Transaction = require("../features/transactions/Transaction.model");
  const Subscription = require("../features/subscriptions/Subscription.model");
  
  const count = await Transaction.countDocuments({ userId });
  if (count === 0) {
    const foodCat = await Category.findOne({ name: "Food" });
    const allowCat = await Category.findOne({ name: "Allowance" });
    const rentCat = await Category.findOne({ name: "Hostel/Rent" });
    const transportCat = await Category.findOne({ name: "Transport" });
    const entertainmentCat = await Category.findOne({ name: "Entertainment" });

    const now = new Date();
    await Transaction.insertMany([
      {
        userId,
        categoryId: allowCat?._id || foodCat?._id,
        amount: 1500,
        type: "income",
        description: "Monthly Student Allowance",
        date: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      {
        userId,
        categoryId: rentCat?._id || foodCat?._id,
        amount: 450,
        type: "expense",
        description: "Campus Hostel Accommodation",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      },
      {
        userId,
        categoryId: foodCat?._id,
        amount: 45.5,
        type: "expense",
        description: "Campus Dining Hall Meal Pack",
        date: new Date(now.getFullYear(), now.getMonth(), 4),
      },
      {
        userId,
        categoryId: transportCat?._id || foodCat?._id,
        amount: 25.0,
        type: "expense",
        description: "City Transit Card Top-up",
        date: new Date(now.getFullYear(), now.getMonth(), 6),
      },
      {
        userId,
        categoryId: entertainmentCat?._id || foodCat?._id,
        amount: 14.99,
        type: "expense",
        description: "Spotify Premium Student",
        date: new Date(now.getFullYear(), now.getMonth(), 8),
      },
    ]);

    const subCount = await Subscription.countDocuments({ user: userId });
    if (subCount === 0) {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 3);
      await Subscription.create({
        user: userId,
        service_name: "Spotify",
        amount: 5.99,
        billing_cycle: "monthly",
        next_due_date: nextDue,
      });
    }
  }
};

const seedAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@campuscoin.com").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $setOnInsert: {
          name: "Campus Coin Admin",
          email: adminEmail,
          role: "admin",
          isActive: true,
        },
        $set: { passwordHash, isVerified: true },
      },
      { upsert: true, new: true }
    );
    await seedSampleRecords(admin._id);
    console.log("Admin user initialized successfully.");
  } catch (err) {
    console.error("Admin seed error:", err.message);
  }
};

const seedDemoStudent = async () => {
  try {
    const studentEmail = "student@campuscoin.com";
    const passwordHash = await bcrypt.hash("Student@123", 12);

    const student = await User.findOneAndUpdate(
      { email: studentEmail },
      {
        $setOnInsert: {
          name: "Alex Rivera",
          email: studentEmail,
          role: "student",
          academicYear: "Junior (Year 3)",
          monthlyAllowanceBaseline: 1500,
          monthlySavingsGoal: 300,
          currency: "USD",
          isActive: true,
        },
        $set: { passwordHash, isVerified: true },
      },
      { upsert: true, new: true }
    );
    await seedSampleRecords(student._id);
    console.log("Demo student initialized successfully.");
  } catch (err) {
    console.error("Student seed error:", err.message);
  }
};

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments({ isDefault: true });
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      console.log("Default categories seeded successfully.");
    }
  } catch (err) {
    console.error("Category seed error:", err.message);
  }
};

module.exports = { seedAdmin, seedDemoStudent, seedDefaultCategories, DEFAULT_CATEGORIES };
