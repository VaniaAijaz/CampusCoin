const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Transaction = require("../transactions/Transaction.model");
const Category = require("../categories/Category.model");
const Budget = require("../budgets/Budget.model");
const Subscription = require("../subscriptions/Subscription.model");
const Debt = require("../debts/Debt.model");
const Goal = require("../goals/Goal.model");

/**
 * Gathers a structured, real-time financial snapshot for the authenticated student.
 * Never fabricates data; uses real MongoDB aggregations and relations.
 */
const getUserFinancialContext = async (userId) => {
  if (!userId) return null;

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const [
      incomeMonthlyAgg,
      expenseMonthlyAgg,
      categoryExpensesAgg,
      recentTransactions,
      budgets,
      subscriptions,
      debts,
      goals,
    ] = await Promise.all([
      // Current month income
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId.toString()),
            type: "income",
            date: { $gte: startOfMonth, $lte: endOfMonth },
            isDeleted: false,
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // Current month expenses
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId.toString()),
            type: "expense",
            date: { $gte: startOfMonth, $lte: endOfMonth },
            isDeleted: false,
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),

      // Current month category breakdown
      Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId.toString()),
            type: "expense",
            date: { $gte: startOfMonth, $lte: endOfMonth },
            isDeleted: false,
          },
        },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$category.name", "Uncategorized"] },
            icon: { $ifNull: ["$category.icon", "tag"] },
            color: { $ifNull: ["$category.color", "#64748B"] },
            total: 1,
            count: 1,
          },
        },
      ]),

      // Recent 8 transactions
      Transaction.find({ userId, isDeleted: false })
        .populate("categoryId", "name icon color")
        .sort({ date: -1 })
        .limit(8)
        .lean(),

      // Active budgets
      Budget.find({ userId }).populate("categoryId", "name icon color").lean(),

      // Active Subscriptions
      Subscription.find({ userId, is_active: true }).sort({ next_due_date: 1 }).limit(6).lean(),

      // Pending Debts / Khata
      Debt.find({ userId, settlement_status: "pending" }).sort({ createdAt: -1 }).limit(6).lean(),

      // Savings Goals
      Goal.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const totalIncome = incomeMonthlyAgg[0]?.total || 0;
    const totalExpense = expenseMonthlyAgg[0]?.total || 0;
    const netBalance = totalIncome - totalExpense;
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay);
    const dailyBurnRate = currentDay > 0 ? parseFloat((totalExpense / currentDay).toFixed(2)) : 0;
    const projectedMonthEnd = parseFloat((totalExpense + dailyBurnRate * daysRemaining).toFixed(2));

    // Map budgets with utilization
    const mappedBudgets = budgets.map((b) => {
      const catExpense = categoryExpensesAgg.find(
        (c) => c._id?.toString() === b.categoryId?._id?.toString()
      );
      const spent = catExpense ? catExpense.total : b.spentAmount || 0;
      const limit = b.limitAmount || 1;
      const pct = Math.round((spent / limit) * 100);
      return {
        category: b.categoryId?.name || "Budget Item",
        limit,
        spent,
        percentUsed: pct,
        isOverBudget: spent > limit,
        remaining: Math.max(0, limit - spent),
      };
    });

    const owedToMe = debts
      .filter((d) => d.direction === "owed_to_me")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const iOwe = debts
      .filter((d) => d.direction === "i_owe")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      monthName: now.toLocaleString("default", { month: "long", year: "numeric" }),
      daysRemainingInMonth: daysRemaining,
      summary: {
        totalIncomeMonthly: parseFloat(totalIncome.toFixed(2)),
        totalExpenseMonthly: parseFloat(totalExpense.toFixed(2)),
        netBalance: parseFloat(netBalance.toFixed(2)),
        dailyBurnRate,
        projectedMonthEnd,
      },
      categoryExpenses: categoryExpensesAgg.map((c) => ({
        category: c.name,
        total: parseFloat(c.total.toFixed(2)),
        count: c.count,
      })),
      budgets: mappedBudgets,
      recentTransactions: recentTransactions.map((t) => ({
        description: t.description || "Untitled",
        category: t.categoryId?.name || "General",
        type: t.type,
        amount: t.amount,
        date: new Date(t.date).toLocaleDateString(),
        paymentMethod: t.paymentMethod,
      })),
      subscriptions: subscriptions.map((s) => ({
        name: s.service_name,
        amount: s.amount,
        billingCycle: s.billing_cycle,
        nextDueDate: s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : "N/A",
      })),
      khataDebts: {
        totalOwedToMe: owedToMe,
        totalIOwe: iOwe,
        pendingRecords: debts.map((d) => ({
          person: d.person_name,
          amount: d.amount,
          direction: d.direction === "owed_to_me" ? "Owes me" : "I owe them",
          reason: d.reason || "Peer expense",
        })),
      },
      savingsGoals: goals.map((g) => ({
        name: g.target_name,
        targetAmount: g.target_amount,
        currentSaved: g.current_saved,
        progressPercent: g.target_amount > 0 ? Math.round((g.current_saved / g.target_amount) * 100) : 0,
      })),
    };
  } catch (err) {
    console.error("Error gathering user financial context:", err.message);
    return null;
  }
};

/**
 * Builds the dynamic system prompt enclosing CampusCoin product knowledge,
 * student finance boundaries, and real authenticated user metrics.
 */
const buildSystemPrompt = (user, financialContext) => {
  let prompt = `You are "CampusCoin AI", a friendly, knowledgeable, and encouraging student financial assistant embedded inside CampusCoin — a modern, student-focused budgeting and expense-tracking web application.

### YOUR ROLE & PERSONALITY:
- Name: CampusCoin AI
- Tone: Friendly, modern, concise, supportive, and practical for university/college students.
- Formatting: Use clean markdown with clear bullet points, bold key figures, and occasional emojis (📊, 💡, 🎯, 🚀, 💰) to keep responses easy to scan.
- Financial Safety Disclaimer: Always act as an educational budgeting guide. You provide helpful suggestions and data-driven insights based on their recorded CampusCoin numbers, NOT certified licensed financial advice.

### CAMPUSCOIN APPLICATION FEATURES & NAVIGATION:
1. **Dashboard** (/app): Real-time financial health score, net balance, monthly burn rate, spending velocity gauges, expense distribution donut chart, and AI summary pills.
2. **Transactions** (/app/transactions): Log daily income and expenses, assign categories, search/filter receipts, CSV bulk import, and quick-add modals.
3. **Khata (Peer Ledger)** (/app/khata): Track peer IOUs and split expenses with friends or flatmates (who owes whom, settlement status, reminders).
4. **Budget** (/app/budget): Set monthly spending caps by category (Food, Transport, Books, Entertainment, etc.) with real-time percentage progress bars and over-budget warnings.
5. **Subscriptions** (/app/subscriptions): Track recurring recurring costs (Spotify, Netflix, gym, campus dorm Wi-Fi) and upcoming renewal due dates.
6. **Reports** (/app/reports): Detailed monthly analytics, category breakdown trends, income vs. expense graphs, and downloadable PDF/CSV audit reports.
7. **Categories** (/app/categories): Manage default & custom categories with personalized icons and colors.
8. **Profile & Settings** (/app/profile): Adjust monthly allowance baseline, savings target, UI color themes (Blue, Green, Red), and export student data.

### COMMON EXPENSE CATEGORIES IN CAMPUSCOIN:
- Food & Dining (Mess food, groceries, coffee, late-night takeout)
- Housing & Rent (Hostel fees, apartment rent, dorm utilities)
- Academics & Books (Textbooks, course packs, lab supplies, exam fees)
- Transit & Travel (Campus shuttle, metro card, bus pass, rideshares)
- Subscriptions (Streaming services, software tools, student plans)
- Entertainment & Social (Movies, outings, campus club events)
- Health & Personal Care (Pharmacy, gym membership, grooming)
- Miscellaneous (Emergency stationeries, laundry, printouts)

### HOW TO ANSWER:
1. **When answering user-specific financial questions** (e.g. "How much did I spend?", "What is my food spending?", "Am I on budget?"):
   - ALWAYS look at the real-time financial context provided below.
   - Quote exact figures from their context.
   - If their data shows zero expenses in a category or no transactions logged, explicitly and politely tell them they haven't recorded any expenses in that category yet, and guide them to click "+ Add Transaction" in the Transactions tab.
   - NEVER invent or make up transactions, balances, or budget numbers.

2. **When answering feature or general guidance questions** (e.g. "How do budgets work?", "How do I save money on food?", "How do I add an expense?"):
   - Provide clear, step-by-step guidance referencing CampusCoin's features.
   - Offer student-friendly saving tips (e.g., meal prepping vs food delivery apps, tracking student discounts, setting 10% emergency buffer).
`;

  if (user && financialContext) {
    prompt += `
\n### CURRENT AUTHENTICATED USER PROFILE:
- Student Name: ${user.name || "Student"}
- Academic Year: ${user.academicYear || "University Student"}
- Currency: ${user.currency || "USD"}
- Monthly Allowance Baseline: $${user.monthlyAllowanceBaseline || 0}
- Monthly Savings Goal: $${user.monthlySavingsGoal || 0}

### USER'S LIVE FINANCIAL CONTEXT (${financialContext.monthName}):
- Total Income this Month: $${financialContext.summary.totalIncomeMonthly}
- Total Expenses this Month: $${financialContext.summary.totalExpenseMonthly}
- Net Balance: $${financialContext.summary.netBalance >= 0 ? "+" : ""}$${financialContext.summary.netBalance}
- Daily Burn Rate: $${financialContext.summary.dailyBurnRate}/day (${financialContext.daysRemainingInMonth} days remaining in month)
- Projected Month-End Expenses: $${financialContext.summary.projectedMonthEnd}

### SPENDING BY CATEGORY THIS MONTH:
${
  financialContext.categoryExpenses.length > 0
    ? financialContext.categoryExpenses.map((c) => `- ${c.category}: $${c.total} (${c.count} transactions)`).join("\n")
    : "- No expense transactions recorded yet this month."
}

### ACTIVE CATEGORY BUDGETS:
${
  financialContext.budgets.length > 0
    ? financialContext.budgets
        .map(
          (b) =>
            `- ${b.category}: $${b.spent} spent of $${b.limit} limit (${b.percentUsed}% used)${
              b.isOverBudget ? " ⚠️ OVER BUDGET" : ` ($${b.remaining} remaining)`
            }`
        )
        .join("\n")
    : "- No category budgets created yet."
}

### UPCOMING ACTIVE SUBSCRIPTIONS:
${
  financialContext.subscriptions.length > 0
    ? financialContext.subscriptions
        .map((s) => `- ${s.name}: $${s.amount} (${s.billingCycle}, next due: ${s.nextDueDate})`)
        .join("\n")
    : "- No active subscriptions registered."
}

### KHATA / PEER DEBT BALANCE:
- Total Owed To Student: $${financialContext.khataDebts.totalOwedToMe}
- Total Student Owes: $${financialContext.khataDebts.totalIOwe}
${
  financialContext.khataDebts.pendingRecords.length > 0
    ? "Active IOUs:\n" +
      financialContext.khataDebts.pendingRecords
        .map((d) => `  * ${d.person}: $${d.amount} (${d.direction} - ${d.reason})`)
        .join("\n")
    : "  * No pending peer IOUs."
}

### ACTIVE SAVINGS GOALS:
${
  financialContext.savingsGoals.length > 0
    ? financialContext.savingsGoals
        .map((g) => `- ${g.name}: $${g.currentSaved} saved towards $${g.targetAmount} goal (${g.progressPercent}%)`)
        .join("\n")
    : "- No savings goals created yet."
}

### RECENT TRANSACTIONS (LATEST):
${
  financialContext.recentTransactions.length > 0
    ? financialContext.recentTransactions
        .map((t) => `- [${t.date}] ${t.type.toUpperCase()}: $${t.amount} for "${t.description}" (${t.category} via ${t.paymentMethod})`)
        .join("\n")
    : "- No recent transactions recorded."
}
`;
  } else {
    prompt += `
\n### USER STATUS: Guest / Exploring CampusCoin
- The user is currently not logged in or browsing public pages.
- Answer general questions about CampusCoin features, how student budgeting works, smart student money-saving tips, and invite them to log in or create a free account to track their real finances.
`;
  }

  return prompt;
};

/**
 * Execute dynamic AI response via Google Gemini API with fallback handling.
 */
const generateAiResponse = async ({ message, history = [], user, financialContext }) => {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey === "your_api_key_here") {
    return {
      reply:
        "👋 **CampusCoin AI is almost ready!**\n\nTo enable live dynamic AI responses, please add your Google Gemini API key to the root `.env` file:\n\n```env\nAI_API_KEY=your_actual_api_key_here\n```\n\nOnce added, restart the server and I'll be able to analyze your real-time finances and answer any questions dynamically!",
      isConfigured: false,
    };
  }

  const systemInstruction = buildSystemPrompt(user, financialContext);

  const genAI = new GoogleGenerativeAI(apiKey);

  // Model hierarchy for resilience
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
  ];

  // Format previous history turns for Gemini API
  const formattedContents = [];

  // Add system instruction as premier context turn if needed
  formattedContents.push({
    role: "user",
    parts: [{ text: `System Instruction & Context:\n${systemInstruction}\n\nPlease acknowledge your role as CampusCoin AI.` }],
  });
  formattedContents.push({
    role: "model",
    parts: [{ text: "Understood! I am CampusCoin AI, ready to assist with real-time student budgeting, expense tracking, and financial insights." }],
  });

  // Append validated conversational history turns (limit last 8 turns for token efficiency)
  const validHistory = (Array.isArray(history) ? history : []).slice(-8);
  for (const turn of validHistory) {
    if (turn.role && turn.content) {
      formattedContents.push({
        role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
        parts: [{ text: String(turn.content) }],
      });
    }
  }

  // Add current user message
  formattedContents.push({
    role: "user",
    parts: [{ text: message }],
  });

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.65,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const response = await model.generateContent({
        contents: formattedContents,
      });

      const replyText = response.response.text();
      if (replyText && replyText.trim().length > 0) {
        return {
          reply: replyText.trim(),
          isConfigured: true,
          modelUsed: modelName,
        };
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} call failed:`, err.message);
      lastError = err;
    }
  }

  // If all models failed
  console.error("All Gemini model attempts failed:", lastError?.message);
  return {
    reply:
      "⚠️ **CampusCoin AI Encountered a Temporary Error**\n\nI couldn't reach the AI service right now. Please check that your API key is valid and has sufficient quota, or try asking your question again in a moment.",
    isConfigured: true,
    error: lastError?.message,
  };
};

module.exports = {
  getUserFinancialContext,
  buildSystemPrompt,
  generateAiResponse,
};
