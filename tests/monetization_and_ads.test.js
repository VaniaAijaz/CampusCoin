const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server/server");
const User = require("../server/features/auth/User.model");

describe("Monetization & Ad-Free Subscription Tier (Free vs Premium $2/mo)", () => {
  let studentToken = null;
  let studentUser = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const stamp = Date.now();
    studentUser = await User.create({
      name: "Monetization Test Student",
      email: `monetization_test_${stamp}@campuscoin.edu`,
      passwordHash: "mockhash123",
      role: "student",
      isVerified: true,
      plan: "free",
      isPremium: false,
    });

    const secret = process.env.JWT_SECRET || "super_secret_jwt_campuscoin_key_2026_techwiz_secure";
    studentToken = jwt.sign({ id: studentUser._id, role: studentUser.role }, secret, { expiresIn: "1d" });
  });

  afterAll(async () => {
    if (studentUser?._id) await User.findByIdAndDelete(studentUser._id);
  });

  test("GET /api/users/membership returns Free tier by default with ads enabled", async () => {
    const res = await request(app)
      .get("/api/users/membership")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan).toBe("free");
    expect(res.body.isPremium).toBe(false);
    expect(res.body.adFree).toBe(false);
  });

  test("POST /api/users/upgrade-premium upgrades student to Premium ($2/month ≈ PKR 500) and marks ad-free", async () => {
    const res = await request(app)
      .post("/api/users/upgrade-premium")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan).toBe("premium");
    expect(res.body.isPremium).toBe(true);
    expect(res.body.adFree).toBe(true);

    // Verify in DB
    const freshUser = await User.findById(studentUser._id);
    expect(freshUser.plan).toBe("premium");
    expect(freshUser.isPremium).toBe(true);
    expect(freshUser.premiumExpiresAt).toBeDefined();
  });

  test("GET /api/users/membership confirms Premium ad-free status", async () => {
    const res = await request(app)
      .get("/api/users/membership")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan).toBe("premium");
    expect(res.body.isPremium).toBe(true);
    expect(res.body.adFree).toBe(true);
  });

  test("POST /api/users/cancel-premium downgrades back to Free tier with ads enabled", async () => {
    const res = await request(app)
      .post("/api/users/cancel-premium")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan).toBe("free");
    expect(res.body.isPremium).toBe(false);
    expect(res.body.adFree).toBe(false);
  });
});
