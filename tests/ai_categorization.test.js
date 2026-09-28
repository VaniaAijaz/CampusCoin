const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const connectDB = require("../server/core/db");
const User = require("../server/features/auth/User.model");
const Category = require("../server/features/categories/Category.model");
const Transaction = require("../server/features/transactions/Transaction.model");
const generateToken = require("../server/core/generateToken");

describe("AI Expense Categorization & Manual Override Test Suite (12 Points)", () => {
  let studentUser;
  let authToken;
  let foodCat;
  let transitCat;
  const unique = Date.now();

  beforeAll(async () => {
    await connectDB();
    studentUser = await User.create({
      name: "AI Test Student",
      email: `ai_suite_${unique}@campuscoin.edu`,
      passwordHash: "$2a$12$dummyhashforaiteststudent123",
      role: "student",
      isVerified: true,
      isActive: true,
      currency: "USD",
    });
    authToken = generateToken({ id: studentUser._id, role: "student" });

    foodCat = await Category.create({ name: `Food_${unique}`, type: "expense", userId: studentUser._id });
    transitCat = await Category.create({ name: `Transport_${unique}`, type: "expense", userId: studentUser._id });
  });

  afterAll(async () => {
    if (studentUser?._id) {
      await Transaction.deleteMany({ userId: studentUser._id });
      await Category.deleteMany({ userId: studentUser._id });
      await User.deleteMany({ _id: studentUser._id });
    }
  });

  // 1-7: Keyword Categorization Matches
  it("1. should suggest 'Food' for cafeteria and meal descriptions", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Campus cafeteria lunch pizza meal" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.suggestion).toBe("Food");
  });

  it("2. should suggest 'Transport' for bus and commute descriptions", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Uber ride to morning lecture hall" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Transport");
  });

  it("3. should suggest 'Hostel/Rent' for accommodation descriptions", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Student hostel room rent monthly fee" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Hostel/Rent");
  });

  it("4. should suggest 'Academics' for book and tuition fees", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Calculus textbook course pack from library" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Academics");
  });

  it("5. should suggest 'Subscriptions' for streaming services", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Spotify premium monthly student plan" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Subscriptions");
  });

  it("6. should suggest 'Entertainment' for movies and events", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Weekend cinema movie ticket outing" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Entertainment");
  });

  it("7. should suggest 'Part-time Job' for freelancing and stipends", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "Part-time tutor stipend freelance salary" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Part-time Job");
  });

  // 8-10: Edge Cases & Validation
  it("8. should return suggestion=null when no known keywords are matched", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "xyz quantum entanglement apparatus" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBeNull();
  });

  it("9. should reject empty description with 400 Bad Request", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("10. should handle case-insensitive input matching ('BURGER', 'LUNCH')", async () => {
    const res = await request(app)
      .post("/api/tips/ai-categorize")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ description: "BURGER KING DINNER" });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe("Food");
  });

  // 11-12: Strict Manual Override Verification
  it("11. Manual Override: user can save transaction under user-selected category despite different AI suggestion", async () => {
    // Description matches "Food" ("burger"), but student manually picks Transit category
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 25,
        type: "expense",
        categoryId: transitCat._id, // User explicitly selected Transport instead of Food
        description: "Late night burger run via transit",
      });

    expect(res.status).toBe(201);
    const returnedCatId = res.body.transaction.categoryId._id || res.body.transaction.categoryId;
    expect(returnedCatId.toString()).toBe(transitCat._id.toString());
  });

  it("12. Manual Override: category in database strictly reflects the student's manual override choice", async () => {
    const saved = await Transaction.findOne({ description: "Late night burger run via transit" });
    expect(saved).toBeDefined();
    expect(saved.categoryId.toString()).toBe(transitCat._id.toString());
    expect(saved.categoryId.toString()).not.toBe(foodCat._id.toString());
  });
});
