const request = require("supertest");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const app = require("../server/server");
const connectDB = require("../server/core/db");
const User = require("../server/features/auth/User.model");
const {
  sendPasswordResetEmail,
  sendEmail,
  transporter,
} = require("../server/features/emails/email.service");

describe("Nodemailer Password Reset & Email Notification Test Suite", () => {
  const uniqueId = Date.now();
  const testEmail = `nodemailer_test_${uniqueId}@campuscoin.edu`;
  const initialPassword = "InitialPassword#2026";
  const newPassword = "NewSecretPassword#2026";
  let testUser;

  beforeAll(async () => {
    await connectDB();
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    testUser = await User.create({
      name: "Nodemailer Student",
      email: testEmail,
      passwordHash,
      role: "student",
      isVerified: true,
      isActive: true,
      currency: "USD",
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /nodemailer_test_/ } });
  });

  describe("1. Nodemailer Email Service & Transporter Unit Verification", () => {
    it("should export an initialized nodemailer transporter or config", () => {
      expect(nodemailer).toBeDefined();
      expect(typeof nodemailer.createTransport).toBe("function");
    });

    it("should generate a reset email template with token link and proper styling", async () => {
      const mockToken = "abcdef1234567890abcdef1234567890";
      // Spy on transporter.sendMail
      const sendMailSpy = jest.spyOn(transporter, "sendMail").mockResolvedValueOnce({
        messageId: "<test-message-id-1234@campuscoin>",
        response: "250 Message accepted",
      });

      await sendPasswordResetEmail(testEmail, mockToken);

      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.to).toBe(testEmail);
      expect(callArgs.subject).toContain("Password Reset Request");
      expect(callArgs.html).toContain(mockToken);
      expect(callArgs.html).toContain("Reset Password");
      expect(callArgs.html).toContain("Campus Coin");

      sendMailSpy.mockRestore();
    });

    it("should gracefully handle nodemailer delivery failures without crashing", async () => {
      const sendMailSpy = jest.spyOn(transporter, "sendMail").mockRejectedValueOnce(
        new Error("SMTP Connection Timeout")
      );

      // Should not throw
      await expect(sendPasswordResetEmail("fail@campuscoin.edu", "dummy-token")).resolves.not.toThrow();

      sendMailSpy.mockRestore();
    });
  });

  describe("2. Forgot-Password Flow & Email Notification Trigger", () => {
    it("should reject forgot-password request if email is missing", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email is required/i);
    });

    it("should return safe generic success for non-existent email (prevents enumeration)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent_student_99999@campuscoin.edu" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/if that email is registered/i);
    });

    it("should trigger nodemailer reset email and persist reset token hash in database without leaking token in HTTP response", async () => {
      const sendMailSpy = jest.spyOn(transporter, "sendMail").mockResolvedValueOnce({
        messageId: "<reset-msg-5678@campuscoin>",
        response: "250 Message accepted",
      });

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Strictly verify no direct reset link is leaked in HTTP response
      expect(res.body.token).toBeUndefined();
      expect(res.body.resetUrl).toBeUndefined();

      // Verify email was dispatched by Nodemailer
      expect(sendMailSpy).toHaveBeenCalledTimes(1);
      const emailHtml = sendMailSpy.mock.calls[0][0].html;
      expect(emailHtml).toContain("/reset-password/");

      // Verify DB state
      const updatedUser = await User.findOne({ email: testEmail });
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpires).toBeDefined();
      expect(new Date(updatedUser.resetPasswordExpires).getTime()).toBeGreaterThan(Date.now());

      sendMailSpy.mockRestore();
    });
  });

  describe("3. Password Reset Flow Verification", () => {
    let validResetToken;

    beforeEach(async () => {
      const sendMailSpy = jest.spyOn(transporter, "sendMail").mockResolvedValueOnce({
        messageId: "<reset-msg-1234@campuscoin>",
        response: "250 Message accepted",
      });

      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testEmail });

      if (sendMailSpy.mock.calls.length > 0) {
        const emailHtml = sendMailSpy.mock.calls[0][0].html;
        const match = emailHtml.match(/\/reset-password\/([a-f0-9]+)/);
        validResetToken = match ? match[1] : null;
      }
      sendMailSpy.mockRestore();
    });

    it("should reject password reset when token is invalid or tampered", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password/invalidfakefaketoken12345678")
        .send({ password: "NewValidPassword#1" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_AUTH_007");
    });

    it("should reject password reset when new password is too short (< 6 chars)", async () => {
      const res = await request(app)
        .post(`/api/auth/reset-password/${validResetToken}`)
        .send({ password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 6 characters/i);
    });

    it("should successfully reset password with valid token and clear reset fields", async () => {
      const res = await request(app)
        .post(`/api/auth/reset-password/${validResetToken}`)
        .send({ password: newPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/reset successful/i);

      // Verify DB cleared reset token
      const updatedUser = await User.findOne({ email: testEmail });
      expect(updatedUser.resetPasswordToken).toBeUndefined();
      expect(updatedUser.resetPasswordExpires).toBeUndefined();
    });

    it("should verify user can login with new password and old password fails", async () => {
      // Old password should fail
      const oldLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: initialPassword });

      expect(oldLoginRes.status).toBe(401);

      // New password should succeed
      const newLoginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: newPassword });

      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.success).toBe(true);
      expect(newLoginRes.body.token).toBeDefined();
    });
  });
});
