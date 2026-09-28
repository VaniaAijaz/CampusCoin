const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const User = require("../server/features/auth/User.model");
const Category = require("../server/features/categories/Category.model");
const Transaction = require("../server/features/transactions/Transaction.model");
const Budget = require("../server/features/budgets/Budget.model");
const Goal = require("../server/features/goals/Goal.model");
const Subscription = require("../server/features/subscriptions/Subscription.model");
const Insight = require("../server/features/insights/Insight.model");
const { analyzeUserFinances } = require("../server/features/insights/insight.engine");

describe("AI Insights & Recommendations System Tests", () => {
  const testEmail = `ai_test_${Date.now()}@campuscoin.edu`;
  const testPassword = "Password!2026";
  let authToken = "";
  let testUserId = "";
  let foodCatId = "";
  let shoppingCatId = "";
  let transportCatId = "";

  beforeAll(async () => {
    // Register test student
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Alex Rivera",
        email: testEmail,
        password: testPassword,
        academicYear: "Sophomore",
        monthlyAllowanceBaseline: 800,
        monthlySavingsGoal: 150,
      });

    authToken = regRes.body.token;
    testUserId = regRes.body.user.id || regRes.body.user._id;

    // Create or find categories
    let foodCat = await Category.findOne({ name: "Food" });
    if (!foodCat) {
      foodCat = await Category.create({ name: "Food", type: "expense", icon: "utensils", color: "#F59E0B" });
    }
    foodCatId = foodCat._id.toString();

    let shopCat = await Category.findOne({ name: "Shopping" });
    if (!shopCat) {
      shopCat = await Category.create({ name: "Shopping", type: "expense", icon: "shopping-bag", color: "#EC4899" });
    }
    shoppingCatId = shopCat._id.toString();

    let transCat = await Category.findOne({ name: "Transport" });
    if (!transCat) {
      transCat = await Category.create({ name: "Transport", type: "expense", icon: "bus", color: "#3B82F6" });
    }
    transportCatId = transCat._id.toString();
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $regex: /@campuscoin\.edu$/ } });
    await Transaction.deleteMany({ userId: testUserId });
    await Budget.deleteMany({ userId: testUserId });
    await Goal.deleteMany({ user: testUserId });
    await Subscription.deleteMany({ userId: testUserId });
    await Insight.deleteMany({ userId: testUserId });
    await mongoose.connection.close();
  });

  describe("Scenario 6: Insufficient Data Handling", () => {
    it("should return limited data insight when user has fewer than 3 transactions", async () => {
      const result = await analyzeUserFinances(testUserId);
      expect(result.insights.length).toBeGreaterThan(0);
      const limited = result.insights.find((i) => i.insightType === "insufficient_data");
      expect(limited).toBeDefined();
      expect(limited.title).toContain("Limited transaction history");
      expect(limited.category).toBe("understand");
    });
  });

  describe("Scenario 1, 2, 3, 4, 5: Deterministic Financial Insights Engine", () => {
    beforeAll(async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      // Seed historical 3-month transactions for Food (avg ~$100/mo)
      for (let m = 1; m <= 3; m++) {
        await Transaction.create({
          userId: testUserId,
          categoryId: foodCatId,
          amount: 100,
          type: "expense",
          description: "Monthly meal baseline",
          date: new Date(currentYear, currentMonth - m, 15),
          paymentMethod: "Digital Bank",
        });
      }

      // Seed last month Shopping ($50)
      await Transaction.create({
        userId: testUserId,
        categoryId: shoppingCatId,
        amount: 50,
        type: "expense",
        description: "Last month clothes",
        date: new Date(currentYear, currentMonth - 1, 10),
        paymentMethod: "Digital Bank",
      });

      // Current month: High food spend ($250, +150% above $100 avg)
      await Transaction.create({
        userId: testUserId,
        categoryId: foodCatId,
        amount: 250,
        type: "expense",
        description: "Bulk dining hall & takeout",
        date: new Date(currentYear, currentMonth, 5),
        paymentMethod: "Digital Bank",
      });

      // Current month: Shopping spike ($120 vs $50 last month, +140%)
      await Transaction.create({
        userId: testUserId,
        categoryId: shoppingCatId,
        amount: 120,
        type: "expense",
        description: "Winter jacket and stationery",
        date: new Date(currentYear, currentMonth, 7),
        paymentMethod: "Digital Bank",
      });

      // Current month: Transport spend ($60) with Budget ($50) -> Over Budget
      await Transaction.create({
        userId: testUserId,
        categoryId: transportCatId,
        amount: 60,
        type: "expense",
        description: "Campus shuttle pass & rides",
        date: new Date(currentYear, currentMonth, 8),
        paymentMethod: "Digital Bank",
      });

      await Budget.create({
        userId: testUserId,
        categoryId: transportCatId,
        month: new Date(currentYear, currentMonth, 1),
        limitAmount: 50,
        spentAmount: 60,
      });

      // Current month Income: $1000 (total expense is $430, leaving $570 surplus)
      await Transaction.create({
        userId: testUserId,
        categoryId: foodCatId,
        amount: 1000,
        type: "income",
        description: "Monthly allowance & stipend",
        date: new Date(currentYear, currentMonth, 1),
        paymentMethod: "Digital Bank",
      });

      // Savings goal: Laptop (Target $1000, Saved $200)
      await Goal.create({
        user: testUserId,
        target_name: "MacBook Pro",
        target_amount: 1000,
        current_saved: 200,
        target_date: new Date(currentYear + 1, currentMonth, 1),
      });

      // Subscription: Spotify & Notion ($10)
      await Subscription.create({
        user_id: testUserId,
        name: "Spotify Premium",
        amount: 10,
        currency: "USD",
        billing_cycle: "monthly",
        renewal_date: new Date(currentYear, currentMonth + 1, 1),
      });
    });

    it("Scenario 1: should detect High Food Spending above historical average", async () => {
      const result = await analyzeUserFinances(testUserId);
      const foodInsight = result.insights.find(
        (i) => i.insightType === "high_spending" && i.title.toLowerCase().includes("food")
      );
      expect(foodInsight).toBeDefined();
      expect(foodInsight.title).toContain("Food");
      expect(foodInsight.category).toBe("take_action");
      expect(foodInsight.supportingMetrics.currentAmount).toBeGreaterThan(0);
      expect(foodInsight.actionType).toBe("set_limit");
    });

    it("Scenario 2: should detect Shopping spending spike vs last month", async () => {
      const result = await analyzeUserFinances(testUserId);
      const spikeInsight = result.insights.find(
        (i) => i.insightType === "spending_spike" && i.title.toLowerCase().includes("shopping")
      );
      expect(spikeInsight).toBeDefined();
      expect(spikeInsight.title).toContain("Shopping");
      expect(spikeInsight.actionType).toBe("review_spending");
    });

    it("Scenario 3: should detect saving opportunity from monthly surplus", async () => {
      const result = await analyzeUserFinances(testUserId);
      const savingInsight = result.insights.find((i) => i.insightType === "saving_opportunity");
      expect(savingInsight).toBeDefined();
      expect(savingInsight.category).toBe("grow");
      expect(savingInsight.actionType).toBe("create_savings_plan");
    });

    it("Scenario 4: should calculate realistic timeline scenarios for active goal", async () => {
      const result = await analyzeUserFinances(testUserId);
      const goalInsight = result.insights.find((i) => i.insightType === "savings_goal");
      expect(goalInsight).toBeDefined();
      expect(goalInsight.title).toContain("MacBook Pro");
      expect(goalInsight.supportingMetrics.goalTarget).toBeGreaterThan(0);
      expect(goalInsight.supportingMetrics.goalSaved).toBeGreaterThan(0);
      expect(goalInsight.supportingMetrics.targetMonths).toBeGreaterThan(0);
    });

    it("Scenario 5: should detect recurring subscriptions without false usage claims", async () => {
      const result = await analyzeUserFinances(testUserId);
      const subInsight = result.insights.find((i) => i.insightType === "recurring_subscriptions");
      expect(subInsight).toBeDefined();
      expect(subInsight.category).toBe("save");
      expect(subInsight.actionType).toBe("review_subscriptions");
      expect(subInsight.summary).not.toContain("unused");
    });

    it("Scenario 8: should provide explainable numbers in 'Why am I getting this?'", async () => {
      const result = await analyzeUserFinances(testUserId);
      for (const ins of result.insights) {
        expect(typeof ins.explanation).toBe("string");
        expect(ins.explanation.length).toBeGreaterThan(10);
        expect(ins.supportingMetrics).toBeDefined();
      }
    });
  });

  describe("API Endpoint Integration Tests (/api/insights)", () => {
    beforeAll(async () => {
      let u = await User.findById(testUserId);
      if (!u) {
        u = await User.create({
          name: "Alex Rivera",
          email: `alex_${Date.now()}@campuscoin.edu`,
          passwordHash: "$2a$12$dummyHashForTestingAlexRivera123",
          academicYear: "Sophomore",
        });
        testUserId = u._id.toString();
      }
      const generateToken = require("../server/core/generateToken");
      authToken = generateToken({ id: testUserId, role: u.role || "student" });
    });

    it("GET /api/insights without token should return 401", async () => {
      const res = await request(app).get("/api/insights");
      expect(res.status).toBe(401);
    });

    it("GET /api/insights with token should return active recommendations", async () => {
      const res = await request(app)
        .get("/api/insights")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.insights)).toBe(true);
      expect(res.body.insights.length).toBeGreaterThan(0);
    });

    it("GET /api/insights/dashboard should return top 3 prioritized recommendations", async () => {
      const res = await request(app)
        .get("/api/insights/dashboard")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.insights.length).toBeLessThanOrEqual(3);
    });

    it("POST /api/insights/generate should force fresh recalculation", async () => {
      const res = await request(app)
        .post("/api/insights/generate")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.insights.length).toBeGreaterThan(0);
    });

    it("PUT /api/insights/:id/bookmark should toggle bookmark", async () => {
      const getRes = await request(app)
        .get("/api/insights")
        .set("Authorization", `Bearer ${authToken}`);

      const insightId = getRes.body.insights[0]._id;

      const bmRes = await request(app)
        .put(`/api/insights/${insightId}/bookmark`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(bmRes.status).toBe(200);
      expect(bmRes.body.success).toBe(true);
      expect(typeof bmRes.body.isBookmarked).toBe("boolean");
    });

    it("PUT /api/insights/:id/dismiss should dismiss recommendation from active feed", async () => {
      const getRes = await request(app)
        .get("/api/insights")
        .set("Authorization", `Bearer ${authToken}`);

      const insightId = getRes.body.insights[0]._id;

      const disRes = await request(app)
        .put(`/api/insights/${insightId}/dismiss`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(disRes.status).toBe(200);
      expect(disRes.body.success).toBe(true);
      expect(disRes.body.insight.isDismissed).toBe(true);
    });

    it("GET /api/insights/forecast should return deterministic month-end cash flow forecast", async () => {
      const res = await request(app)
        .get("/api/insights/forecast")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.forecast).toBeDefined();
      expect(typeof res.body.forecast.dailyBurnRate).toBe("number");
      expect(typeof res.body.forecast.projectedMonthEndExpense).toBe("number");
    });

    it("POST /api/insights/apply-budgets should apply verified budget adjustments", async () => {
      const res = await request(app)
        .post("/api/insights/apply-budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          suggestedBudgets: [
            {
              categoryId: foodCatId,
              categoryName: "Food",
              currentLimit: 200,
              suggestedLimit: 250,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.budgets)).toBe(true);
    });

    it("GET /api/insights/dynamic should return single dynamic tip", async () => {
      const res = await request(app)
        .get("/api/insights/dynamic")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.tip).toBe("string");
    });
  });

  describe("Personalization Multi-User Verification (Rule 38)", () => {
    it("should produce distinct, context-specific insights for two different users", async () => {
      // User B: High income surplus student with minimal expenses
      const userBEmail = `student_b_${Date.now()}@campuscoin.edu`;
      const regB = await request(app)
        .post("/api/auth/register")
        .send({
          name: "User B",
          email: userBEmail,
          password: testPassword,
          academicYear: "Senior",
          monthlyAllowanceBaseline: 1500,
          monthlySavingsGoal: 300,
        });

      const userBId = regB.body.user.id || regB.body.user._id;

      // Seed User B with 1 income and 1 normal low expense
      const now = new Date();
      await Transaction.create({
        userId: userBId,
        categoryId: foodCatId,
        amount: 2000,
        type: "income",
        description: "Monthly Scholarship",
        date: new Date(now.getFullYear(), now.getMonth(), 1),
      });

      await Transaction.create({
        userId: userBId,
        categoryId: foodCatId,
        amount: 80,
        type: "expense",
        description: "Standard grocery",
        date: new Date(now.getFullYear(), now.getMonth(), 2),
      });

      await Transaction.create({
        userId: userBId,
        categoryId: foodCatId,
        amount: 70,
        type: "expense",
        description: "Meal plan",
        date: new Date(now.getFullYear(), now.getMonth(), 3),
      });

      const resultA = await analyzeUserFinances(testUserId);
      const resultB = await analyzeUserFinances(userBId);

      // User A (high food spend & spike) vs User B (high surplus, healthy budget)
      const userAInsightTypes = resultA.insights.map((i) => i.insightType);
      const userBInsightTypes = resultB.insights.map((i) => i.insightType);

      expect(userAInsightTypes).toContain("high_spending");
      expect(userBInsightTypes).toContain("saving_opportunity");
      expect(resultB.metrics.netSurplus).toBeGreaterThan(resultA.metrics.netSurplus);

      // Clean up User B
      await User.deleteMany({ _id: userBId });
      await Transaction.deleteMany({ userId: userBId });
    });
  });
});
