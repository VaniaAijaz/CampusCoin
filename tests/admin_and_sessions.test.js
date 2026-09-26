const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const User = require("../server/features/auth/User.model");
const Session = require("../server/features/users/Session.model");
const Announcement = require("../server/features/admin/Announcement.model");

describe("V6 Admin Engine, Real Session Time Tracking & Announcements", () => {
  let adminToken = null;
  let studentToken = null;
  let studentUser = null;
  let adminUser = null;

  beforeAll(async () => {
    // Connect to database if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const stamp = Date.now();
    // Create distinct test student
    studentUser = await User.create({
      name: "Tracked Student",
      email: `tracked_student_${stamp}@campuscoin.edu`,
      password_hash: "mockhash123",
      role: "student",
      isVerified: true,
      monthlyAllowanceBaseline: 1200,
      monthlySavingsGoal: 300,
      currency_preference: "USD",
    });

    const jwt = require("jsonwebtoken");
    studentToken = jwt.sign(
      { id: studentUser._id, role: studentUser.role },
      process.env.JWT_SECRET || "super_secret_jwt_campuscoin_key_2026_techwiz_secure",
      { expiresIn: "1d" }
    );

    // Create distinct test admin
    adminUser = await User.create({
      name: "Security Admin",
      email: `security_admin_${stamp}@campuscoin.edu`,
      password_hash: "mockhash456",
      role: "admin",
      isVerified: true,
    });

    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || "super_secret_jwt_campuscoin_key_2026_techwiz_secure",
      { expiresIn: "1d" }
    );
  });

  afterAll(async () => {
    if (studentUser?._id) {
      await User.findByIdAndDelete(studentUser._id);
      await Session.deleteMany({ user_id: studentUser._id });
    }
    if (adminUser?._id) {
      await User.findByIdAndDelete(adminUser._id);
      await Announcement.deleteMany({ created_by_admin_id: adminUser._id });
    }
  });

  describe("1. Real Session Time Tracking & Heartbeat (POST /api/users/heartbeat)", () => {
    it("should record active engagement heartbeat and initialize a session", async () => {
      const res = await request(app)
        .post("/api/users/heartbeat")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.session_id).toBeDefined();
      expect(res.body.total_minutes_active).toBeGreaterThanOrEqual(1);

      const session = await Session.findById(res.body.session_id);
      expect(session).not.toBeNull();
      expect(session.is_active).toBe(true);
      expect(session.user_id.toString()).toBe(studentUser._id.toString());
    });

    it("should increment total_minutes_active on subsequent heartbeat ping", async () => {
      const res = await request(app)
        .post("/api/users/heartbeat")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total_minutes_active).toBeGreaterThanOrEqual(1);
    });

    it("should close the active session on explicit logout (POST /api/users/logout-session)", async () => {
      const res = await request(app)
        .post("/api/users/logout-session")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const session = await Session.findOne({ user_id: studentUser._id, is_active: true });
      expect(session).toBeNull();
    });
  });

  describe("2. Admin User-Tracking Dashboard & Privacy Protection (GET /api/admin/users)", () => {
    it("should aggregate average session minutes and total hours active without exposing raw financial amounts or passwords", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .query({ search: studentUser.email })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users.length).toBeGreaterThanOrEqual(1);

      const userRecord = res.body.users.find((u) => u._id.toString() === studentUser._id.toString());
      expect(userRecord).toBeDefined();
      expect(userRecord.name).toBe("Tracked Student");
      expect(userRecord.email).toBe(studentUser.email);
      expect(userRecord.total_transactions).toBeDefined();
      expect(typeof userRecord.average_session_minutes).toBe("number");
      expect(typeof userRecord.total_hours_used).toBe("number");

      // Critical Privacy Guarantees
      expect(userRecord.password).toBeUndefined();
      expect(userRecord.password_hash).toBeUndefined();
      expect(userRecord.monthlyAllowanceBaseline).toBeUndefined();
      expect(userRecord.monthlySavingsGoal).toBeUndefined();
    });
  });

  describe("3. Admin Announcement Broadcasting System", () => {
    let createdAnnouncementId = null;

    it("should allow admin to create an announcement with priority and message (POST /api/admin/announcements)", async () => {
      const res = await request(app)
        .post("/api/admin/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Exam Period Quiet Hours",
          message: "Library extended study areas open 24/7.",
          priority: "urgent",
          type: "warning",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.announcement.title).toBe("Exam Period Quiet Hours");
      expect(res.body.announcement.priority).toBe("urgent");
      createdAnnouncementId = res.body.announcement._id;
    });

    it("should allow admin to update announcement priority and status (PUT /api/admin/announcements/:id)", async () => {
      const res = await request(app)
        .put(`/api/admin/announcements/${createdAnnouncementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          priority: "high",
          message: "Library quiet hours starting tonight.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.announcement.priority).toBe("high");
      expect(res.body.announcement.message).toBe("Library quiet hours starting tonight.");
    });

    it("should allow logged-in students to fetch active announcements with priority (GET /api/announcements)", async () => {
      const res = await request(app)
        .get("/api/announcements")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.announcements)).toBe(true);

      const found = res.body.announcements.find((a) => a._id.toString() === createdAnnouncementId.toString());
      expect(found).toBeDefined();
      expect(found.priority).toBe("high");
    });

    it("should allow admin to delete announcement (DELETE /api/admin/announcements/:id)", async () => {
      const res = await request(app)
        .delete(`/api/admin/announcements/${createdAnnouncementId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Announcement.findById(createdAnnouncementId);
      expect(check).toBeNull();
    });
  });
});
