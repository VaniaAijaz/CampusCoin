const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const User = require("../server/features/auth/User.model");

describe("Auth Flow Integration Tests (Registration, Login, Verification)", () => {
  const testEmail = `test_student_${Date.now()}@campuscoin.edu`;
  const testPassword = "SecurePassword#2026";
  let verificationToken = "";
  let verificationOtp = "";
  let authToken = "";

  afterAll(async () => {
    // Cleanup created test records
    await User.deleteMany({ email: { $regex: /@campuscoin\.edu$/ } });
    await mongoose.connection.close();
  });

  describe("POST /api/auth/register", () => {
    it("should reject registration with invalid payload using Zod validation", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "invalid-email", password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_VALIDATION_001");
      expect(typeof res.body.message).toBe("string");
    });

    it("should successfully register a student with isVerified: false and return token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Taylor Student",
          email: testEmail,
          password: testPassword,
          academicYear: "Sophomore (Year 2)",
          monthlyAllowanceBaseline: 1200,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.isVerified).toBe(false);

      // Check HttpOnly cookie is set
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("token="))).toBe(true);

      // Retrieve generated OTP/Token from DB to test verification flow
      const createdUser = await User.findOne({ email: testEmail });
      expect(createdUser).toBeDefined();
      verificationOtp = createdUser.verificationOtp;
      verificationToken = createdUser.verificationToken;
    });

    it("should reject registration if email is duplicate", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Taylor Duplicate",
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_AUTH_002");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "WrongPassword999" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_AUTH_003");
    });

    it("should login successfully with correct credentials and set HttpOnly cookie", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: testPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
      authToken = res.body.token;

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("token="))).toBe(true);
    });
  });

  describe("POST /api/auth/verify-email", () => {
    it("should reject invalid verification code", async () => {
      const res = await request(app)
        .post("/api/auth/verify-email")
        .send({ email: testEmail, otp: "000000" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_AUTH_007");
    });

    it("should verify email with valid 6-digit OTP and update user.isVerified to true", async () => {
      const res = await request(app)
        .post("/api/auth/verify-email")
        .send({ email: testEmail, otp: verificationOtp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.isVerified).toBe(true);

      const dbUser = await User.findOne({ email: testEmail });
      expect(dbUser.isVerified).toBe(true);
      expect(dbUser.verificationOtp).toBeUndefined();
    });
  });
});
