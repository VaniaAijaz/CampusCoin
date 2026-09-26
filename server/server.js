const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load unified root .env first, then local .env if present
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const connectDB = require("./core/db");
const { connectRedis } = require("./core/redis");
const { notFoundHandler, errorHandler } = require("./core/errorMiddleware");
const { seedAdmin, seedDemoStudent, seedDefaultCategories } = require("./core/seed");

// Initialize Database connection & seed defaults
connectDB().then(async (conn) => {
  if (conn) {
    await seedAdmin();
    await seedDemoStudent();
    await seedDefaultCategories();
  }
});

// Initialize Redis
connectRedis().then(() => {
  // Sync live market currency exchange rates via Redis
  const CurrencyService = require("./core/currency.service");
  CurrencyService.syncRates();
  // Refresh rates every 12 hours
  setInterval(() => CurrencyService.syncRates(), 12 * 60 * 60 * 1000);
});

const app = express();

// Security and CORS middleware
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev to avoid CORS friction
      }
    },
    credentials: true,
  })
);

const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Domain-driven Feature Routes
app.use("/api/auth", require("./features/auth/auth.routes"));
app.use("/api/users", require("./features/users/user.routes"));
app.use("/api/transactions", require("./features/transactions/transaction.routes"));
app.use("/api/budgets", require("./features/budgets/budget.routes"));
app.use("/api/categories", require("./features/categories/category.routes"));
app.use("/api/reports", require("./features/reports/report.routes"));
app.use("/api/tips", require("./features/tips/tip.routes"));
app.use("/api/admin", require("./features/admin/admin.routes"));
app.use("/api/subscriptions", require("./features/subscriptions/subscription.routes"));
app.use("/api/debts", require("./features/debts/debt.routes"));
app.use("/api/goals", require("./features/goals/goal.routes"));

// Initialize scheduled background jobs (disabled in test mode)
if (process.env.NODE_ENV !== "test") {
  require("./features/emails/cron.jobs");
}

// Public announcements endpoint (accessible to all logged-in students)
const Announcement = require("./features/admin/Announcement.model");
const { protect } = require("./core/authMiddleware");
app.get("/api/announcements", protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate("created_by_admin_id", "name email")
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Campus Coin API",
    status: "healthy",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Fallback 404 & Global Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Campus Coin API Server running on port ${PORT}`);
  });
}

module.exports = app;
