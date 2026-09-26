const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server/server");
const User = require("../server/features/auth/User.model");
const Category = require("../server/features/categories/Category.model");
const Transaction = require("../server/features/transactions/Transaction.model");
const Budget = require("../server/features/budgets/Budget.model");
const Debt = require("../server/features/debts/Debt.model");
const CurrencyService = require("../server/core/currency.service");

describe("V4 Dynamic Data Layer & Currency Engine Integration Tests", () => {
  const testEmail = `v4_test_${Date.now()}@campuscoin.edu`;
  const testPassword = "Password!2026";
  let authToken = "";
  let testUser = null;
  let testCatId = "";
  const createdTxIds = [];
  const createdBudgetIds = [];
  const createdDebtIds = [];

  beforeAll(async () => {
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Ayesha Malik",
        email: testEmail,
        password: testPassword,
        academicYear: "Sophomore (Year 2)",
      });

    authToken = regRes.body.token;
    testUser = regRes.body.user;

    let cat = await Category.findOne({ name: "Hostel/Rent", type: "expense" });
    if (!cat) {
      cat = await Category.create({
        name: "Hostel/Rent",
        type: "expense",
        icon: "home",
        color: "#64748B",
        isDefault: true,
      });
    }
    testCatId = cat._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@campuscoin\.edu$/ } });
    if (createdTxIds.length > 0) {
      await Transaction.deleteMany({ _id: { $in: createdTxIds } });
    }
    if (createdBudgetIds.length > 0) {
      await Budget.deleteMany({ _id: { $in: createdBudgetIds } });
    }
    if (createdDebtIds.length > 0) {
      await Debt.deleteMany({ _id: { $in: createdDebtIds } });
    }
    await mongoose.connection.close();
  });

  describe("1. CurrencyService Unit & Logic Verification", () => {
    it("should maintain correct exchange rates for USD, EUR, and PKR", () => {
      expect(CurrencyService.getRate("USD")).toBe(1.0);
      expect(CurrencyService.getRate("EUR")).toBe(0.95);
      expect(CurrencyService.getRate("PKR")).toBe(278.0);
    });

    it("should correctly convert user input to base currency (USD) and back", () => {
      // 2780 PKR = 10 USD
      const baseUSD = CurrencyService.toBase(2780, "PKR");
      expect(baseUSD).toBeCloseTo(10.0, 4);

      // 10 USD = 9.5 EUR
      const convertedEUR = CurrencyService.fromBase(baseUSD, "EUR");
      expect(convertedEUR).toBe(9.5);

      // 10 USD = 2780 PKR
      const convertedPKR = CurrencyService.fromBase(baseUSD, "PKR");
      expect(convertedPKR).toBe(2780);
    });

    it("should format currency with appropriate international symbols", () => {
      expect(CurrencyService.format(100, "USD")).toBe("$100.00");
      expect(CurrencyService.format(100, "EUR")).toBe("€100.00");
      expect(CurrencyService.format(100, "PKR")).toBe("₨100.00");
    });
  });

  describe("2. Profile Currency Preference API (PUT /api/users/profile/currency)", () => {
    it("should reject invalid currency with 400 validation error", async () => {
      const res = await request(app)
        .put("/api/users/profile/currency")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ currency: "INVALID_CURR" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_VALIDATION_001");
    });

    it("should successfully switch currency preference to EUR", async () => {
      const res = await request(app)
        .put("/api/users/profile/currency")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ currency_preference: "EUR" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.currency_preference).toBe("EUR");
      expect(res.body.user.currency_preference).toBe("EUR");
    });

    it("should successfully switch currency preference to PKR", async () => {
      const res = await request(app)
        .put("/api/users/profile/currency")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ currency: "PKR" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.currency_preference).toBe("PKR");
      expect(res.body.currency).toBe("PKR");
    });
  });

  describe("3. Base Currency Storage & Dynamic Interception", () => {
    let createdTxMongoId = "";

    it("should store transaction in base currency (USD) in MongoDB while returning user's currency (PKR)", async () => {
      // User is currently set to PKR (1 USD = 278 PKR)
      // Input 27800 PKR (= 100 USD in base)
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          categoryId: testCatId,
          amount: 27800,
          type: "expense",
          description: "Semester Hostel Fee",
          paymentMethod: "Cash",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction.amount).toBe(27800);
      expect(res.body.transaction.currency).toBe("PKR");
      expect(res.body.transaction.paymentMethod).toBe("Cash");

      createdTxMongoId = res.body.transaction._id;
      createdTxIds.push(createdTxMongoId);

      // Verify directly from MongoDB that the amount is stored in base currency (USD = 100)
      const rawInMongo = await Transaction.findById(createdTxMongoId);
      expect(rawInMongo.amount).toBeCloseTo(100.0, 2);
      expect(rawInMongo.isDeleted).toBe(false);
    });

    it("should dynamically convert amounts when user switches to EUR", async () => {
      // Switch user currency preference to EUR
      await request(app)
        .put("/api/users/profile/currency")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ currency_preference: "EUR" });

      // Fetch transactions: 100 USD base * 0.95 = 95 EUR
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const targetTx = res.body.transactions.find((t) => t._id.toString() === createdTxMongoId);
      expect(targetTx).toBeDefined();
      expect(targetTx.amount).toBe(95);
      expect(targetTx.currency).toBe("EUR");
    });

    it("should dynamically convert amounts when user switches to USD", async () => {
      // Switch user currency preference to USD
      await request(app)
        .put("/api/users/profile/currency")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ currency: "USD" });

      // Fetch transactions: 100 USD base * 1.0 = 100 USD
      const res = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const targetTx = res.body.transactions.find((t) => t._id.toString() === createdTxMongoId);
      expect(targetTx).toBeDefined();
      expect(targetTx.amount).toBe(100);
      expect(targetTx.currency).toBe("USD");
    });
  });

  describe("4. Dynamic Trigger Logic & Soft Deletes", () => {
    let budgetId = "";
    let expenseTxId = "";
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    it("should create a budget stored in base currency (USD)", async () => {
      // User is in USD: set monthly limit to 200 USD
      const res = await request(app)
        .post("/api/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          categoryId: testCatId,
          month: currentMonthStr,
          limitAmount: 200,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.budget.limitAmount).toBe(200);
      budgetId = res.body.budget._id;
      createdBudgetIds.push(budgetId);

      // Verify raw storage in MongoDB
      const rawBudget = await Budget.findById(budgetId);
      expect(rawBudget.limitAmount).toBe(200);
    });

    it("should dynamically recalculate budget spentAmount when a new transaction is logged", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          categoryId: testCatId,
          amount: 80,
          type: "expense",
          description: "Course Pack & Printouts",
        });

      expect(res.status).toBe(201);
      expenseTxId = res.body.transaction._id;
      createdTxIds.push(expenseTxId);

      // Verify budget spentAmount was updated by the trigger
      const budgetRes = await request(app)
        .get(`/api/budgets?month=${currentMonthStr}`)
        .set("Authorization", `Bearer ${authToken}`);

      const b = budgetRes.body.budgets.find((item) => item._id.toString() === budgetId);
      expect(b).toBeDefined();
      // Total spent = 100 (from previous test) + 80 = 180 USD
      expect(b.spentAmount).toBe(180);
    });

    it("should soft-delete transaction (is_deleted: true) and dynamically recalculate budget spentAmount", async () => {
      const delRes = await request(app)
        .delete(`/api/transactions/${expenseTxId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify soft deletion in MongoDB
      const rawTx = await Transaction.findById(expenseTxId).setOptions({ includeDeleted: true });
      expect(rawTx.isDeleted).toBe(true);

      // Verify soft-deleted transaction is NOT returned in standard query
      const listRes = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`);
      const deletedItem = listRes.body.transactions.find((t) => t._id.toString() === expenseTxId);
      expect(deletedItem).toBeUndefined();

      // Verify budget spentAmount dynamically decreased by 80 (back to 100)
      const budgetRes = await request(app)
        .get(`/api/budgets?month=${currentMonthStr}`)
        .set("Authorization", `Bearer ${authToken}`);

      const b = budgetRes.body.budgets.find((item) => item._id.toString() === budgetId);
      expect(b.spentAmount).toBe(100);
    });
  });

  describe("5. Khata (IOU / Debts) Zod Validation & Dynamic Currency", () => {
    it("should reject invalid Khata payload with 400 validation error", async () => {
      const res = await request(app)
        .post("/api/debts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          direction: "owed_to_me",
          amount: -100, // Invalid negative
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("ERR_VALIDATION_001");
    });

    it("should create Khata entry, store in base currency, and return in user's currency preference", async () => {
      // User is currently USD: log 50 USD debt
      const res = await request(app)
        .post("/api/debts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          counterparty_name: "Hamza Tariq",
          direction: "owed_to_me",
          amount: 50,
          settlement_status: "pending",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.debt.amount).toBe(50);
      expect(res.body.debt.counterparty_name).toBe("Hamza Tariq");

      const debtId = res.body.debt._id;
      createdDebtIds.push(debtId);

      // Switch user currency preference to PKR
      await request(app)
        .put("/api/users/profile/currency")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ currency_preference: "PKR" });

      // Fetch Khata list: 50 USD base * 278 = 13900 PKR
      const listRes = await request(app)
        .get("/api/debts")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listRes.status).toBe(200);
      const targetDebt = listRes.body.debts.find((d) => d._id.toString() === debtId);
      expect(targetDebt).toBeDefined();
      expect(targetDebt.amount).toBe(13900);
      expect(targetDebt.currency).toBe("PKR");
    });
  });
});
