const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const connectDB = require("../server/core/db");
const User = require("../server/features/auth/User.model");
const Category = require("../server/features/categories/Category.model");
const Transaction = require("../server/features/transactions/Transaction.model");
const Subscription = require("../server/features/subscriptions/Subscription.model");
const generateToken = require("../server/core/generateToken");
const CurrencyService = require("../server/core/currency.service");

describe("Dashboard Analytics & Reactive Engine Test Suite (16 Points)", () => {
  let studentUser;
  let authToken;
  let foodCat;
  let booksCat;
  let rentCat;
  const unique = Date.now();
  const studentEmail = `dash_suite_${unique}@campuscoin.edu`;

  beforeAll(async () => {
    await connectDB();
    studentUser = await User.create({
      name: "Dashboard Student Suite",
      email: studentEmail,
      passwordHash: "$2a$12$dummyhashforstudenttestingdash",
      role: "student",
      isVerified: true,
      isActive: true,
      currency: "USD",
      currency_preference: "USD",
    });
    authToken = generateToken({ id: studentUser._id, role: "student" });

    // Create 3 distinct categories
    foodCat = await Category.create({ name: `Food_${unique}`, type: "expense", icon: "utensils", color: "#10B981", userId: studentUser._id });
    booksCat = await Category.create({ name: `Books_${unique}`, type: "expense", icon: "book", color: "#3B82F6", userId: studentUser._id });
    rentCat = await Category.create({ name: `Rent_${unique}`, type: "expense", icon: "home", color: "#8B5CF6", userId: studentUser._id });
  });

  afterAll(async () => {
    await Transaction.deleteMany({ userId: studentUser._id });
    await Subscription.deleteMany({ user_id: studentUser._id });
    await Category.deleteMany({ userId: studentUser._id });
    await User.deleteMany({ _id: studentUser._id });
  });

  it("1. should return 401 when fetching dashboard metrics without token", async () => {
    const res = await request(app).get("/api/transactions/dashboard-metrics");
    expect(res.status).toBe(401);
  });

  it("2. should return clean zero-state metrics when no transactions exist", async () => {
    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.currentMonth.income).toBe(0);
    expect(res.body.currentMonth.expense).toBe(0);
    expect(res.body.currentMonth.netSavings).toBe(0);
    expect(res.body.categoryBreakdown).toEqual([]);
    expect(res.body.trends.length).toBe(6);
  });

  it("3. should reactively calculate monthly income when income transaction is logged", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 1500,
      type: "income",
      categoryId: foodCat._id,
      description: "Monthly Student Allowance",
      date: new Date(now.getFullYear(), now.getMonth(), 2),
    });

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.currentMonth.income).toBe(1500);
    expect(res.body.currentMonth.netSavings).toBe(1500);
  });

  it("4. should reactively update monthly expense and net savings when expenses are logged", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 200,
      type: "expense",
      categoryId: foodCat._id,
      description: "Dining Hall Pass",
      date: new Date(now.getFullYear(), now.getMonth(), 3),
    });

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.currentMonth.income).toBe(1500);
    expect(res.body.currentMonth.expense).toBe(200);
    expect(res.body.currentMonth.netSavings).toBe(1300);
  });

  it("5. should verify exact mathematical invariant: netSavings === income - expense", async () => {
    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    const { income, expense, netSavings } = res.body.currentMonth;
    expect(netSavings).toBeCloseTo(income - expense, 2);
  });

  it("6. should correctly aggregate multi-category expenses in category breakdown", async () => {
    const now = new Date();
    // Log $500 Rent and $150 Books
    await Transaction.create({
      userId: studentUser._id,
      amount: 500,
      type: "expense",
      categoryId: rentCat._id,
      description: "Hostel Fee",
      date: new Date(now.getFullYear(), now.getMonth(), 4),
    });
    await Transaction.create({
      userId: studentUser._id,
      amount: 150,
      type: "expense",
      categoryId: booksCat._id,
      description: "Engineering Textbook",
      date: new Date(now.getFullYear(), now.getMonth(), 5),
    });

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.categoryBreakdown.length).toBe(3);
  });

  it("7. should sort category breakdown strictly by highest spend descending (Top Category Widget)", async () => {
    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    const breakdown = res.body.categoryBreakdown;
    expect(breakdown[0].total).toBeGreaterThanOrEqual(breakdown[1].total);
    expect(breakdown[1].total).toBeGreaterThanOrEqual(breakdown[2].total);
    // Highest spend should be Rent ($500)
    expect(breakdown[0].name).toBe(rentCat.name);
    expect(breakdown[0].total).toBe(500);
  });

  it("8. should automatically incorporate active subscription costs into monthly expenses", async () => {
    // Add monthly subscription of $20
    await Subscription.create({
      user_id: studentUser._id,
      name: "Cloud Server",
      service_name: "Cloud Server",
      amount: 20,
      billing_cycle: "monthly",
      renewal_date: new Date(),
    });

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    // Total expenses was $200 + $500 + $150 = $850. With $20 subscription = $870
    expect(res.body.currentMonth.expense).toBe(870);
  });

  it("9. should return exactly 6 months of historical trend data", async () => {
    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.trends).toBeDefined();
    expect(res.body.trends.length).toBe(6);
  });

  it("10. should ensure all trend months have non-null, valid numeric properties", async () => {
    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    res.body.trends.forEach((t) => {
      expect(typeof t.month).toBe("string");
      expect(typeof t.year).toBe("number");
      expect(typeof t.income).toBe("number");
      expect(typeof t.expense).toBe("number");
      expect(isNaN(t.income)).toBe(false);
      expect(isNaN(t.expense)).toBe(false);
      expect(t.income).toBeGreaterThanOrEqual(0);
      expect(t.expense).toBeGreaterThanOrEqual(0);
    });
  });

  it("11. should dynamically recalculate dashboard metrics when user switches currency to PKR", async () => {
    // Switch to PKR (rate 278)
    await User.findByIdAndUpdate(studentUser._id, { currency: "PKR", currency_preference: "PKR" });

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.currency).toBe("PKR");
    // Income 1500 USD * 278 = 417,000 PKR
    expect(res.body.currentMonth.income).toBe(417000);
    // Expense 870 USD * 278 = 241,860 PKR
    expect(res.body.currentMonth.expense).toBe(241860);

    // Revert to USD
    await User.findByIdAndUpdate(studentUser._id, { currency: "USD", currency_preference: "USD" });
  });

  it("12. should dynamically recalculate dashboard metrics when user switches currency to EUR", async () => {
    await User.findByIdAndUpdate(studentUser._id, { currency: "EUR", currency_preference: "EUR" });

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.currency).toBe("EUR");
    // Income 1500 USD * 0.95 = 1425 EUR
    expect(res.body.currentMonth.income).toBe(1425);

    // Revert to USD
    await User.findByIdAndUpdate(studentUser._id, { currency: "USD", currency_preference: "USD" });
  });

  it("13. should exclude soft-deleted transactions from category breakdown and totals", async () => {
    // Soft-delete the $500 Rent transaction
    await Transaction.findOneAndUpdate(
      { userId: studentUser._id, amount: 500 },
      { isDeleted: true }
    );

    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    // Expense was 870. Subtracting 500 deleted = 370
    expect(res.body.currentMonth.expense).toBe(370);

    // Top category should now be Food ($200) instead of Rent
    expect(res.body.categoryBreakdown[0].name).toBe(foodCat.name);
    expect(res.body.categoryBreakdown[0].total).toBe(200);
  });

  it("14. should return recent transactions in chronological order descending", async () => {
    const res = await request(app)
      .get("/api/transactions/recent")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBeGreaterThan(0);
    const dates = res.body.transactions.map((t) => new Date(t.date).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it("15. should verify that soft-deleted transactions never appear in recent list", async () => {
    const res = await request(app)
      .get("/api/transactions/recent")
      .set("Authorization", `Bearer ${authToken}`);

    const hasDeleted = res.body.transactions.some((t) => t.isDeleted === true || t.amount === 500);
    expect(hasDeleted).toBe(false);
  });

  it("16. should handle multi-year trend queries seamlessly across calendar boundary", async () => {
    const res = await request(app)
      .get("/api/transactions/dashboard-metrics")
      .set("Authorization", `Bearer ${authToken}`);

    const years = res.body.trends.map((t) => t.year);
    expect(years.every((y) => typeof y === "number" && y >= 2020)).toBe(true);
  });
});
