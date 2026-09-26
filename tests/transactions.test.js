const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const User = require("../server/features/auth/User.model");
const Category = require("../server/features/categories/Category.model");
const Transaction = require("../server/features/transactions/Transaction.model");

describe("Transactions Endpoint Integration Tests", () => {
  const testEmail = `tx_test_${Date.now()}@campuscoin.edu`;
  const testPassword = "Password!2026";
  let authToken = "";
  let categoryId = "";
  let createdTxId = "";

  beforeAll(async () => {
    // Register and login test user
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Morgan Hunter",
        email: testEmail,
        password: testPassword,
      });

    authToken = regRes.body.token;

    // Fetch or create a default category
    let cat = await Category.findOne({ type: "expense" });
    if (!cat) {
      cat = await Category.create({
        name: "General Expense",
        type: "expense",
        icon: "shopping-bag",
        color: "#3B82F6",
        isDefault: true,
      });
    }
    categoryId = cat._id.toString();
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: { $regex: /@campuscoin\.edu$/ } });
    if (createdTxId) {
      await Transaction.findByIdAndDelete(createdTxId);
    }
    await mongoose.connection.close();
  });

  describe("GET /api/transactions without authentication", () => {
    it("should return sanitized 401 when no token is provided", async () => {
      const res = await request(app).get("/api/transactions");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_AUTH_004");
      expect(typeof res.body.message).toBe("string");
    });
  });

  describe("POST /api/transactions validation with Zod", () => {
    it("should reject transaction with negative or zero amount", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: -50,
          type: "expense",
          categoryId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_VALIDATION_001");
      expect(res.body.message).toMatch(/Amount must be greater than zero/);
    });

    it("should reject transaction with invalid type", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 25.5,
          type: "invalid_type",
          categoryId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_VALIDATION_001");
    });

    it("should successfully create a valid transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 42.5,
          type: "expense",
          categoryId,
          description: "Textbooks and Stationery",
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction).toBeDefined();
      expect(res.body.transaction.amount).toBe(42.5);
      createdTxId = res.body.transaction._id;
    });
  });

  describe("GET /api/transactions with authentication", () => {
    it("should retrieve transactions list successfully", async () => {
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
