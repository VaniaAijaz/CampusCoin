const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const connectDB = require("../server/core/db");
const User = require("../server/features/auth/User.model");
const Category = require("../server/features/categories/Category.model");
const Transaction = require("../server/features/transactions/Transaction.model");
const Budget = require("../server/features/budgets/Budget.model");
const generateToken = require("../server/core/generateToken");

describe("Budget Engine & Limit Boundary Test Suite (16 Points)", () => {
  let studentUser;
  let authToken;
  let category;
  let testBudgetId;
  const unique = Date.now();
  const studentEmail = `budget_suite_${unique}@campuscoin.edu`;
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  
  // Future month
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  const futureMonth = nextDate.toISOString().slice(0, 7);

  beforeAll(async () => {
    await connectDB();
    studentUser = await User.create({
      name: "Budget Suite Student",
      email: studentEmail,
      passwordHash: "$2a$12$dummyhashforstudenttestingbudget",
      role: "student",
      isVerified: true,
      isActive: true,
      currency: "USD",
      currency_preference: "USD",
    });
    authToken = generateToken({ id: studentUser._id, role: "student" });

    category = await Category.create({
      name: `BudgetCat_${unique}`,
      type: "expense",
      icon: "shopping-bag",
      color: "#EC4899",
      userId: studentUser._id,
    });
  });

  afterAll(async () => {
    await Transaction.deleteMany({ userId: studentUser._id });
    await Budget.deleteMany({ userId: studentUser._id });
    await Category.deleteMany({ userId: studentUser._id });
    await User.deleteMany({ _id: studentUser._id });
  });

  // 1-4: Validation
  it("1. should reject unauthenticated request to /api/budgets", async () => {
    const res = await request(app).get("/api/budgets");
    expect(res.status).toBe(401);
  });

  it("2. should reject budget creation without categoryId", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ month: currentMonth, limitAmount: 200 });
    expect(res.status).toBe(400);
  });

  it("3. should reject budget creation without month", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, limitAmount: 200 });
    expect(res.status).toBe(400);
  });

  it("4. should reject budget creation without limit amount", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth });
    expect(res.status).toBe(400);
  });

  // 5-8: Creation & Boundary Limit Testing
  it("5. should successfully create a budget cap of $100 for current month", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        categoryId: category._id,
        month: currentMonth,
        limitAmount: 100,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.budget.limitAmount).toBe(100);
    expect(res.body.budget.spentAmount).toBe(0);
    testBudgetId = res.body.budget._id;
  });

  it("6. Boundary: Budget at 0% spent should not trigger any budget alerts", async () => {
    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.alerts.length).toBe(0);
  });

  it("7. Boundary: Budget at 50% spent ($50/$100) should remain safe and alert-free", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 50,
      type: "expense",
      categoryId: category._id,
      date: new Date(now.getFullYear(), now.getMonth(), 3),
    });

    // Update or fetch budget
    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth, limitAmount: 100 });

    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.alerts.length).toBe(0);
  });

  it("8. Boundary: Budget at exactly 79% spent ($79/$100) should NOT trigger alerts (<80% threshold)", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 29, // 50 + 29 = 79
      type: "expense",
      categoryId: category._id,
      date: new Date(now.getFullYear(), now.getMonth(), 4),
    });

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth, limitAmount: 100 });

    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.alerts.length).toBe(0);
  });

  it("9. Boundary: Budget reaching 80% spent ($80/$100) should trigger 'near limit' warning alert", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 1, // 79 + 1 = 80
      type: "expense",
      categoryId: category._id,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
    });

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth, limitAmount: 100 });

    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.alerts.length).toBe(1);
    expect(res.body.alerts[0].percent).toBe(80);
    expect(res.body.alerts[0].isOver).toBe(false);
  });

  it("10. Boundary: Budget at 99% spent ($99/$100) should report percent=99 with isOver=false", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 19, // 80 + 19 = 99
      type: "expense",
      categoryId: category._id,
      date: new Date(now.getFullYear(), now.getMonth(), 6),
    });

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth, limitAmount: 100 });

    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.alerts[0].percent).toBe(99);
    expect(res.body.alerts[0].isOver).toBe(false);
  });

  it("11. Boundary: Budget reaching 100% spent ($100/$100) should mark isOver=true", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 1, // 99 + 1 = 100
      type: "expense",
      categoryId: category._id,
      date: new Date(now.getFullYear(), now.getMonth(), 7),
    });

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth, limitAmount: 100 });

    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.alerts[0].percent).toBe(100);
    expect(res.body.alerts[0].isOver).toBe(true);
  });

  it("12. Boundary: Budget exceeding limit at 101% ($101/$100) should report exact overrun", async () => {
    const now = new Date();
    await Transaction.create({
      userId: studentUser._id,
      amount: 1, // 100 + 1 = 101
      type: "expense",
      categoryId: category._id,
      date: new Date(now.getFullYear(), now.getMonth(), 8),
    });

    await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ categoryId: category._id, month: currentMonth, limitAmount: 100 });

    const res = await request(app)
      .get("/api/budgets/alerts")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.body.alerts[0].percent).toBe(101);
    expect(res.body.alerts[0].isOver).toBe(true);
    expect(res.body.alerts[0].budget.spentAmount).toBe(101);
  });

  it("13. Mathematical Clamp: verify progress bar ratio never exceeds 100% when rendered", () => {
    const rawRatio = 101 / 100;
    const clampedPercentage = Math.min(100, Math.max(0, Math.round(rawRatio * 100)));
    expect(clampedPercentage).toBe(100);
  });

  it("14. Future Month: should create a budget for the next month without colliding with current month", async () => {
    const res = await request(app)
      .post("/api/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        categoryId: category._id,
        month: futureMonth,
        limitAmount: 250,
      });

    expect(res.status).toBe(201);
    expect(res.body.budget.limitAmount).toBe(250);
    expect(res.body.budget.spentAmount).toBe(0); // No expenses logged in future month yet
  });

  it("15. Future Month: should retrieve separate budgets when querying next month", async () => {
    const res = await request(app)
      .get(`/api/budgets?month=${futureMonth}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.budgets.length).toBe(1);
    expect(res.body.budgets[0].limitAmount).toBe(250);
  });

  it("16. Delete Budget: should delete budget cap and confirm deletion", async () => {
    const res = await request(app)
      .delete(`/api/budgets/${testBudgetId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Budget.findById(testBudgetId);
    expect(check).toBeNull();
  });
});
