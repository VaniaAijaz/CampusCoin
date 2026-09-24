const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./utils/db");

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/insights", require("./routes/insights"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/tips", require("./routes/tips"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CampusCoin API is running 🚀" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
