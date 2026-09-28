const mongoose = require("mongoose");
const Transaction = require("../transactions/Transaction.model");
const Category = require("../categories/Category.model");
const Budget = require("../budgets/Budget.model");
const Goal = require("../goals/Goal.model");
const Subscription = require("../subscriptions/Subscription.model");
const User = require("../auth/User.model");
const CurrencyService = require("../../core/currency.service");

/**
 * Pure Deterministic Financial Analysis Engine for CampusCoin
 * 
 * Rules:
 * - Deterministic calculations (totals, averages, percentages, forecasts, goal math)
 * - Zero fabricated data or arbitrary assumptions
 * - Fully scoped to authenticated user and accurate currency conversion
 */
const analyzeUserFinances = async (userId) => {
  const user = await User.findById(userId);
  const userCurrency = CurrencyService.getUserCurrency(user);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed (1 to 12)
  const currentDay = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // Time boundaries
  const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const startOfLastMonth = new Date(currentYear, currentMonth - 2, 1);
  const endOfLastMonth = new Date(currentYear, currentMonth - 1, 0, 23, 59, 59);

  const startOf3MonthsAgo = new Date(currentYear, currentMonth - 4, 1);
  const endOf3MonthsAgo = endOfLastMonth;

  // Concurrent aggregation fetching
  const [
    currentMonthExpensesAgg,
    currentMonthIncomeAgg,
    lastMonthExpensesAgg,
    prior3MonthsExpensesAgg,
    allUserTxCount,
    budgets,
    goals,
    subscriptions,
    categories,
    recentExpenseTxns,
  ] = await Promise.all([
    // Current month expenses by category with transactions
    Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId.toString()),
          type: "expense",
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          transactions: {
            $push: {
              _id: "$_id",
              amount: "$amount",
              description: "$description",
              date: "$date",
            },
          },
        },
      },
    ]),

    // Current month income
    Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId.toString()),
          type: "income",
          date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          isDeleted: false,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    // Last month expenses by category
    Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId.toString()),
          type: "expense",
          date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          isDeleted: false,
        },
      },
      { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),

    // Prior 3 months expenses by category for historical average
    Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId.toString()),
          type: "expense",
          date: { $gte: startOf3MonthsAgo, $lte: endOf3MonthsAgo },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { cat: "$categoryId", month: { $month: "$date" } },
          monthTotal: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.cat",
          avgMonthly: { $avg: "$monthTotal" },
          monthsCount: { $sum: 1 },
        },
      },
    ]),

    // Total transaction count across history for data confidence check
    Transaction.countDocuments({
      userId: new mongoose.Types.ObjectId(userId.toString()),
      isDeleted: false,
    }),

    // Active budgets for current month
    Budget.find({ userId }).populate("categoryId", "name icon color isCustom").lean(),

    // Active savings goals
    Goal.find({ user: userId }).sort({ target_date: 1 }).lean(),

    // Active subscriptions
    Subscription.find({
      $or: [{ userId }, { user_id: userId }],
    }).lean(),

    // All categories map
    Category.find({}).lean(),

    // Recent 30 expense transactions for discretionary detection
    Transaction.find({
      userId,
      type: "expense",
      date: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
      isDeleted: false,
    })
      .populate("categoryId", "name icon")
      .sort({ date: -1 })
      .limit(30)
      .lean(),
  ]);

  // Map category IDs to category details
  const categoryMap = {};
  categories.forEach((cat) => {
    categoryMap[cat._id.toString()] = cat;
  });

  // Calculate high-level metrics in user's currency
  const totalIncomeBase = currentMonthIncomeAgg[0]?.total || 0;
  const totalExpenseBase = currentMonthExpensesAgg.reduce((sum, item) => sum + item.total, 0);

  const totalIncome = CurrencyService.fromBase(totalIncomeBase, userCurrency);
  const totalExpense = CurrencyService.fromBase(totalExpenseBase, userCurrency);
  const netSurplus = totalIncome - totalExpense;

  // Daily burn rate and month-end forecast
  const dailyBurnRate = currentDay > 0 ? parseFloat((totalExpense / currentDay).toFixed(2)) : 0;
  const projectedMonthEndExpense = parseFloat((totalExpense + dailyBurnRate * daysRemaining).toFixed(2));

  // Build maps for last month and 3-month averages
  const lastMonthMap = {};
  lastMonthExpensesAgg.forEach((item) => {
    lastMonthMap[item._id.toString()] = CurrencyService.fromBase(item.total, userCurrency);
  });

  const avg3MonthMap = {};
  prior3MonthsExpensesAgg.forEach((item) => {
    avg3MonthMap[item._id.toString()] = CurrencyService.fromBase(item.avgMonthly, userCurrency);
  });

  // Build complete structured categories breakdown
  const categoriesBreakdown = currentMonthExpensesAgg.map((catExp) => {
    const catId = catExp._id ? catExp._id.toString() : "uncategorized";
    const cat = categoryMap[catId] || { name: "General", icon: "tag" };
    const currentAmount = CurrencyService.fromBase(catExp.total, userCurrency);
    const avgAmount = avg3MonthMap[catId] || 0;
    const lastAmount = lastMonthMap[catId] || 0;

    const vs3MonthAvgPercent = avgAmount > 0 ? Math.round(((currentAmount - avgAmount) / avgAmount) * 100) : 0;
    const momPercent = lastAmount > 0 ? Math.round(((currentAmount - lastAmount) / lastAmount) * 100) : 0;

    // Convert transactions to user currency and sort descending
    const convertedTxns = (catExp.transactions || []).map((t) => ({
      _id: t._id,
      amount: CurrencyService.fromBase(t.amount, userCurrency),
      description: t.description || cat.name,
      date: t.date,
    })).sort((a, b) => b.amount - a.amount);

    return {
      categoryId: catId,
      categoryName: cat.name,
      icon: cat.icon || "tag",
      currentAmount: Math.round(currentAmount),
      avgAmount: Math.round(avgAmount),
      lastMonthAmount: Math.round(lastAmount),
      vs3MonthAvgPercent,
      momPercent,
      transactionCount: catExp.count,
      transactions: convertedTxns,
    };
  });

  // Map active budgets
  const activeBudgets = budgets.map((b) => {
    const catId = b.categoryId?._id ? b.categoryId._id.toString() : b.categoryId?.toString();
    const catName = b.categoryId?.name || "General";
    const limit = CurrencyService.fromBase(b.limitAmount, userCurrency);
    const catExp = currentMonthExpensesAgg.find((c) => c._id && c._id.toString() === catId);
    const spent = catExp ? CurrencyService.fromBase(catExp.total, userCurrency) : CurrencyService.fromBase(b.spentAmount || 0, userCurrency);
    const pctUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    return {
      categoryId: catId,
      categoryName: catName,
      limit: Math.round(limit),
      spent: Math.round(spent),
      percentUsed: pctUsed,
      isOverBudget: spent > limit,
      remaining: Math.max(0, Math.round(limit - spent)),
    };
  });

  // Map active goals
  const activeGoals = goals.map((g) => {
    const target = CurrencyService.fromBase(g.target_amount, userCurrency);
    const saved = CurrencyService.fromBase(g.current_saved || 0, userCurrency);
    return {
      goalId: g._id,
      targetName: g.target_name,
      targetAmount: Math.round(target),
      currentSaved: Math.round(saved),
      progressPercent: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
      remainingToSave: Math.max(0, Math.round(target - saved)),
      targetDate: g.target_date,
    };
  });

  // Map active subscriptions
  const activeSubscriptions = subscriptions.map((s) => ({
    name: s.name || s.service_name || "Subscription",
    amount: Math.round(CurrencyService.fromBase(s.amount, userCurrency)),
    billingCycle: s.billing_cycle || "monthly",
  }));

  // Discretionary spending detection
  const discretionaryCategoryKeywords = ["entertainment", "movie", "game", "shopping", "clothes", "dining", "takeout", "cafe", "coffee", "leisure", "social"];
  const discretionaryBreakdown = categoriesBreakdown.filter((c) =>
    discretionaryCategoryKeywords.some((kw) => c.categoryName.toLowerCase().includes(kw))
  );
  const discretionaryTotal = discretionaryBreakdown.reduce((sum, c) => sum + c.currentAmount, 0);
  const discretionaryTxnCount = discretionaryBreakdown.reduce((sum, c) => sum + c.transactionCount, 0);

  // Build verified financial profile for Gemini AI
  const financialProfile = {
    studentName: user?.name || "Student",
    academicYear: user?.academicYear || "University Student",
    currency: userCurrency,
    monthlyAllowanceBaseline: Math.round(CurrencyService.fromBase(user?.monthlyAllowanceBaseline || 0, userCurrency)),
    totalIncome: Math.round(totalIncome),
    totalExpense: Math.round(totalExpense),
    netSurplus: Math.round(netSurplus),
    dailyBurnRate: parseFloat(dailyBurnRate.toFixed(2)),
    projectedMonthEndExpense: Math.round(projectedMonthEndExpense),
    elapsedDaysInMonth: currentDay,
    daysRemainingInMonth: daysRemaining,
    categoriesBreakdown,
    activeBudgets,
    activeGoals,
    activeSubscriptions,
    discretionarySpending: {
      total: Math.round(discretionaryTotal),
      count: discretionaryTxnCount,
      percentOfExpense: totalExpense > 0 ? Math.round((discretionaryTotal / totalExpense) * 100) : 0,
    },
    recentTransactions: recentExpenseTxns.map((t) => ({
      description: t.description,
      amount: Math.round(CurrencyService.fromBase(t.amount, userCurrency)),
      category: t.categoryId?.name || "General",
      date: new Date(t.date).toLocaleDateString(),
    })),
    dataConfidence: {
      totalTransactions: allUserTxCount,
      isSufficient: allUserTxCount >= 3,
    },
  };

  // Build dynamic deterministic insights
  const generatedInsights = [];

  // =========================================================================
  // 1. DATA CONFIDENCE / INSUFFICIENT DATA (Rule 20)
  // =========================================================================
  if (allUserTxCount < 3) {
    generatedInsights.push({
      category: "understand",
      priority: "low",
      insightType: "insufficient_data",
      title: "ℹ️ Limited transaction history",
      summary: `We've only analyzed ${allUserTxCount} recorded transaction${allUserTxCount === 1 ? "" : "s"} so far.`,
      recommendation:
        "Keep recording your income and expenses and CampusCoin AI will start identifying useful patterns.",
      explanation:
        "We've only analyzed a limited amount of transaction history. Keep recording your daily transactions across categories to compute verified statistical baselines.",
      supportingMetrics: {
        transactionCount: allUserTxCount,
        currency: userCurrency,
        currentAmount: totalExpense,
      },
      actionType: "none",
      actionPayload: {},
      generatedAt: new Date(),
    });

    return {
      financialProfile,
      deterministicInsights: generatedInsights,
      insights: generatedInsights,
      metrics: {
        totalIncome,
        totalExpense,
        netSurplus,
        dailyBurnRate,
        projectedMonthEndExpense,
        userCurrency,
      },
    };
  }

  // =========================================================================
  // 2. HIGH SPENDING CATEGORY (Rule 9)
  // =========================================================================
  for (const catExp of categoriesBreakdown) {
    // Meaningfully above user's own normal spending
    if (catExp.avgAmount > 5 && catExp.vs3MonthAvgPercent >= 20 && (catExp.currentAmount - catExp.avgAmount) > 5) {
      const remainingWeeks = Math.max(1, Math.ceil(daysRemaining / 7));
      const suggestedWeekly = Math.max(10, Math.round((catExp.avgAmount * 1.05 - catExp.currentAmount * 0.8) / remainingWeeks));

      generatedInsights.push({
        category: "take_action",
        priority: catExp.vs3MonthAvgPercent >= 35 ? "high" : "medium",
        insightType: "high_spending",
        title: `${getCategoryEmoji(catExp.categoryName)} ${catExp.categoryName} spending is getting high`,
        summary: `You've spent ${formatAmount(catExp.currentAmount, userCurrency)} on ${catExp.categoryName.toLowerCase()} this month. That's ${catExp.vs3MonthAvgPercent}% above your previous 3-month average.`,
        recommendation: `Consider keeping your remaining weekly ${catExp.categoryName.toLowerCase()} expenses around ${formatAmount(suggestedWeekly, userCurrency)}.`,
        explanation: `We noticed that your ${catExp.categoryName.toLowerCase()} spending has increased and is currently ${catExp.vs3MonthAvgPercent}% above your previous 3-month average of ${formatAmount(catExp.avgAmount, userCurrency)}.`,
        supportingMetrics: {
          currentAmount: catExp.currentAmount,
          avgAmount: catExp.avgAmount,
          percentChange: catExp.vs3MonthAvgPercent,
          diffAmount: catExp.currentAmount - catExp.avgAmount,
          currency: userCurrency,
        },
        actionType: "set_limit",
        actionPayload: {
          categoryId: catExp.categoryId,
          categoryName: catExp.categoryName,
          suggestedLimit: Math.round(catExp.avgAmount * 1.1),
        },
        relatedCategoryId: catExp.categoryId,
        relatedCategoryName: catExp.categoryName,
        generatedAt: new Date(),
      });
    }
  }

  // =========================================================================
  // 3. SPENDING SPIKE DETECTION WITH UNDERLYING TXNS (Rule 10)
  // =========================================================================
  for (const catExp of categoriesBreakdown) {
    if (catExp.lastMonthAmount > 5 && catExp.momPercent >= 35 && (catExp.currentAmount - catExp.lastMonthAmount) > 10) {
      const diff = catExp.currentAmount - catExp.lastMonthAmount;

      // Identify top contributing transactions
      const topTxns = (catExp.transactions || []).slice(0, 4);
      const topTxnsTotal = Math.round(topTxns.reduce((s, t) => s + t.amount, 0));
      const topCount = topTxns.length;
      const driverDetail = topCount > 0 ? ` Most of this increase came from ${topCount} transaction${topCount > 1 ? "s" : ""} totaling ${formatAmount(topTxnsTotal, userCurrency)}.` : "";

      generatedInsights.push({
        category: "take_action",
        priority: catExp.momPercent >= 50 ? "high" : "medium",
        insightType: "spending_spike",
        title: `📈 ${catExp.categoryName} spending increased`,
        summary: `You spent ${catExp.momPercent}% more on ${catExp.categoryName} than last month.${driverDetail}`,
        recommendation: `Review recent ${catExp.categoryName.toLowerCase()} transactions to determine whether this was driven by one-time required purchases or recurring habits.`,
        explanation: `Last month you spent ${formatAmount(catExp.lastMonthAmount, userCurrency)} on ${catExp.categoryName}. This month you've recorded ${formatAmount(catExp.currentAmount, userCurrency)} (${formatAmount(diff, userCurrency)} increase).`,
        supportingMetrics: {
          currentAmount: catExp.currentAmount,
          lastMonthAmount: catExp.lastMonthAmount,
          diffAmount: diff,
          percentChange: catExp.momPercent,
          transactionCount: catExp.transactionCount,
          currency: userCurrency,
        },
        actionType: "review_spending",
        actionPayload: {
          categoryId: catExp.categoryId,
          categoryName: catExp.categoryName,
          type: "expense",
        },
        relatedCategoryId: catExp.categoryId,
        relatedCategoryName: catExp.categoryName,
        generatedAt: new Date(),
      });
    }
  }

  // =========================================================================
  // 4. BUDGET EXCEEDED & SHORTFALL WARNINGS & TRANSPORT (Rules 7, 14)
  // =========================================================================
  for (const b of activeBudgets) {
    const isTransport = b.categoryName.toLowerCase().includes("transport") || b.categoryName.toLowerCase().includes("transit") || b.categoryName.toLowerCase().includes("travel");

    if (b.limit > 0) {
      if (b.spent > b.limit) {
        const overAmount = b.spent - b.limit;
        generatedInsights.push({
          category: "take_action",
          priority: "high",
          insightType: isTransport ? "transport_overbudget" : "budget_exceeded",
          title: isTransport ? `🚕 Transport spending is rising` : `⚠️ ${b.categoryName} budget exceeded`,
          summary: isTransport
            ? `You're currently ${formatAmount(overAmount, userCurrency)} over your ${formatAmount(b.limit, userCurrency)} transport budget.`
            : `You've spent ${formatAmount(b.spent, userCurrency)} of your ${formatAmount(b.limit, userCurrency)} ${b.categoryName} budget (${b.percentUsed}% used).`,
          recommendation: isTransport
            ? `Consider reviewing recent transit receipts or adjusting your transport budget to accommodate your commute routine.`
            : `You are currently ${formatAmount(overAmount, userCurrency)} over budget. Pause discretionary spending in this category for the remaining ${daysRemaining} days.`,
          explanation: `Allocated limit for ${b.categoryName}: ${formatAmount(b.limit, userCurrency)}. Logged transactions: ${formatAmount(b.spent, userCurrency)}.`,
          supportingMetrics: {
            currentAmount: b.spent,
            budgetLimit: b.limit,
            diffAmount: overAmount,
            percentChange: b.percentUsed,
            currency: userCurrency,
          },
          actionType: "adjust_budget",
          actionPayload: {
            categoryId: b.categoryId,
            categoryName: b.categoryName,
            limitAmount: b.limit,
            spentAmount: b.spent,
            suggestedLimit: Math.round(b.spent * 1.15),
          },
          relatedCategoryId: b.categoryId,
          relatedCategoryName: b.categoryName,
          generatedAt: new Date(),
        });
      } else if (b.percentUsed >= 80 && daysRemaining > 5) {
        const remaining = b.remaining;
        const dailySafe = Math.max(1, Math.round(remaining / daysRemaining));

        generatedInsights.push({
          category: "take_action",
          priority: "medium",
          insightType: "budget_shortfall_warning",
          title: `⚡ ${b.categoryName} approaching monthly cap`,
          summary: `You've used ${b.percentUsed}% of your ${formatAmount(b.limit, userCurrency)} ${b.categoryName} budget with ${daysRemaining} days remaining.`,
          recommendation: `You have ${formatAmount(remaining, userCurrency)} remaining. Try keeping daily ${b.categoryName.toLowerCase()} spending under ${formatAmount(dailySafe, userCurrency)}/day.`,
          explanation: `At your current velocity, this category will exceed its ${formatAmount(b.limit, userCurrency)} cap before month-end unless daily pace is moderated.`,
          supportingMetrics: {
            currentAmount: b.spent,
            budgetLimit: b.limit,
            remainingBudget: remaining,
            percentChange: b.percentUsed,
            dailyBurnRate: dailySafe,
            currency: userCurrency,
          },
          actionType: "adjust_budget",
          actionPayload: {
            categoryId: b.categoryId,
            categoryName: b.categoryName,
            limitAmount: b.limit,
            spentAmount: b.spent,
          },
          relatedCategoryId: b.categoryId,
          relatedCategoryName: b.categoryName,
          generatedAt: new Date(),
        });
      }
    }
  }

  // =========================================================================
  // 5. SAVING OPPORTUNITIES (Rule 11)
  // =========================================================================
  if (netSurplus > 15 && totalIncome > 30) {
    const suggestedSave = Math.max(10, Math.round(netSurplus * 0.45));
    generatedInsights.push({
      category: "grow",
      priority: "medium",
      insightType: "saving_opportunity",
      title: `💰 You have room to save`,
      summary: `You usually finish the month with around ${formatAmount(netSurplus, userCurrency)} unspent.`,
      recommendation: `Consider saving ${formatAmount(suggestedSave, userCurrency)} toward a savings target or emergency cushion.`,
      explanation: `Total income (${formatAmount(totalIncome, userCurrency)}) exceeds total expenses (${formatAmount(totalExpense, userCurrency)}), providing a healthy financial buffer.`,
      supportingMetrics: {
        currentAmount: Math.round(netSurplus),
        suggestedMonthly: suggestedSave,
        currency: userCurrency,
      },
      actionType: "create_savings_plan",
      actionPayload: {
        suggestedAmount: suggestedSave,
      },
      generatedAt: new Date(),
    });
  }

  // =========================================================================
  // 6. ACTIVE SAVINGS GOAL (Rule 12)
  // =========================================================================
  if (activeGoals.length > 0) {
    const activeGoal = activeGoals[0];
    if (activeGoal.remainingToSave > 0) {
      let suggestedMonthly = Math.max(10, Math.round(activeGoal.remainingToSave / 6));
      if (totalIncome > 0 && suggestedMonthly > totalIncome * 0.3) {
        suggestedMonthly = Math.max(5, Math.round(totalIncome * 0.15));
      }
      const estMonths = Math.max(1, Math.ceil(activeGoal.remainingToSave / suggestedMonthly));

      generatedInsights.push({
        category: "grow",
        priority: "medium",
        insightType: "savings_goal",
        title: `🎯 Goal: ${activeGoal.targetName}`,
        summary: `Target: ${formatAmount(activeGoal.targetAmount, userCurrency)} · Saved: ${formatAmount(activeGoal.currentSaved, userCurrency)} (${activeGoal.progressPercent}%)`,
        recommendation: `Saving ${formatAmount(suggestedMonthly, userCurrency)}/month could help you reach your ${formatAmount(activeGoal.targetAmount, userCurrency)} goal in approximately ${estMonths} month${estMonths > 1 ? "s" : ""}.`,
        explanation: `You've accumulated ${formatAmount(activeGoal.currentSaved, userCurrency)} toward your ${activeGoal.targetName} goal. ${formatAmount(activeGoal.remainingToSave, userCurrency)} remains for full completion.`,
        supportingMetrics: {
          goalTarget: activeGoal.targetAmount,
          goalSaved: activeGoal.currentSaved,
          targetMonths: estMonths,
          suggestedMonthly,
          currency: userCurrency,
        },
        actionType: "create_savings_plan",
        actionPayload: {
          goalId: activeGoal.goalId,
          targetName: activeGoal.targetName,
          targetAmount: activeGoal.targetAmount,
          currentSaved: activeGoal.currentSaved,
          suggestedMonthly,
        },
        generatedAt: new Date(),
      });
    }
  }

  // =========================================================================
  // 7. SUBSCRIPTION INSIGHTS (Rule 13)
  // =========================================================================
  if (activeSubscriptions.length > 0) {
    const totalSubs = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

    generatedInsights.push({
      category: "save",
      priority: "low",
      insightType: "recurring_subscriptions",
      title: `🧾 Recurring subscriptions detected`,
      summary: `You've spent ${formatAmount(totalSubs, userCurrency)} on recurring subscriptions this month.`,
      recommendation: `This payment appears regularly in your transaction history. Review your active subscriptions to confirm they still align with your campus routine.`,
      explanation: `Detected active recurring services including ${activeSubscriptions.slice(0, 3).map((s) => s.name).join(", ")}.`,
      supportingMetrics: {
        currentAmount: totalSubs,
        transactionCount: activeSubscriptions.length,
        currency: userCurrency,
      },
      actionType: "review_subscriptions",
      actionPayload: {},
      generatedAt: new Date(),
    });
  }

  // =========================================================================
  // 8. DISCRETIONARY SPENDING (Rule 15)
  // =========================================================================
  if (discretionaryTotal > 20 && totalExpense > 40 && (discretionaryTotal / totalExpense) >= 0.25) {
    const discPercent = Math.round((discretionaryTotal / totalExpense) * 100);
    generatedInsights.push({
      category: "save",
      priority: "medium",
      insightType: "discretionary_spending",
      title: `🛍️ Discretionary spending overview`,
      summary: `Discretionary purchases accounted for ${formatAmount(discretionaryTotal, userCurrency)} (${discPercent}% of your monthly expenses).`,
      recommendation: `These expenses appear to be discretionary based on their categories/descriptions. Review recent receipts to identify optional areas where minor cuts can boost your savings.`,
      explanation: `Tracked categories including ${discretionaryBreakdown.map((c) => c.categoryName).join(", ")} representing ${discPercent}% of total expenses this month.`,
      supportingMetrics: {
        currentAmount: discretionaryTotal,
        percentChange: discPercent,
        transactionCount: discretionaryTxnCount,
        currency: userCurrency,
      },
      actionType: "review_spending",
      actionPayload: {
        categoryName: discretionaryBreakdown[0]?.categoryName || "Entertainment",
        type: "expense",
      },
      generatedAt: new Date(),
    });
  }

  // =========================================================================
  // 9. EMERGENCY SAVINGS (Rule 17)
  // =========================================================================
  const hasEmergencyGoal = activeGoals.some((g) => g.targetName.toLowerCase().includes("emergency"));
  if (!hasEmergencyGoal && netSurplus > 25 && totalIncome > 50) {
    const suggestedEmergencyTarget = Math.max(100, Math.round(totalExpense * 2));
    const suggestedMonthlyBuffer = Math.max(15, Math.round(netSurplus * 0.3));

    generatedInsights.push({
      category: "grow",
      priority: "low",
      insightType: "emergency_savings",
      title: `🛡️ Build an emergency cushion`,
      summary: `You currently have steady positive cash flow but no designated emergency savings goal.`,
      recommendation: `Consider creating an emergency savings target of ~${formatAmount(suggestedEmergencyTarget, userCurrency)} to safeguard against unexpected campus or academic expenses.`,
      explanation: `With a monthly surplus of ${formatAmount(netSurplus, userCurrency)}, allocating ${formatAmount(suggestedMonthlyBuffer, userCurrency)}/month can build a 2-month security cushion.`,
      supportingMetrics: {
        goalTarget: suggestedEmergencyTarget,
        suggestedMonthly: suggestedMonthlyBuffer,
        currency: userCurrency,
      },
      actionType: "create_emergency_goal",
      actionPayload: {
        suggestedTarget: suggestedEmergencyTarget,
        suggestedMonthly: suggestedMonthlyBuffer,
      },
      generatedAt: new Date(),
    });
  }

  // =========================================================================
  // 10. BUDGET RECOMMENDATIONS / REBALANCING (Rule 18)
  // =========================================================================
  const rebalanceCandidates = [];
  for (const b of activeBudgets) {
    const catExp = categoriesBreakdown.find((c) => c.categoryId === b.categoryId);
    const avg = catExp?.avgAmount || 0;
    if (avg > 10 && b.limit > 0) {
      if (b.spent > b.limit * 1.15) {
        // Consistently over budget -> recommend realistic increase based on history
        const suggested = Math.round(Math.max(b.spent, avg) * 1.1);
        rebalanceCandidates.push({
          categoryId: b.categoryId,
          categoryName: b.categoryName,
          currentLimit: b.limit,
          suggestedLimit: suggested,
          difference: suggested - b.limit,
        });
      } else if (b.spent < b.limit * 0.6 && daysRemaining < 10 && avg < b.limit * 0.75) {
        // Consistently oversized budget -> recommend trimming cap
        const suggested = Math.round(Math.max(avg * 1.15, b.spent * 1.2));
        if (suggested < b.limit) {
          rebalanceCandidates.push({
            categoryId: b.categoryId,
            categoryName: b.categoryName,
            currentLimit: b.limit,
            suggestedLimit: suggested,
            difference: suggested - b.limit,
          });
        }
      }
    }
  }

  if (rebalanceCandidates.length > 0) {
    generatedInsights.push({
      category: "save",
      priority: "medium",
      insightType: "budget_adjustment",
      title: `⚖️ Budget recommendations available`,
      summary: `Based on your actual history, CampusCoin AI suggests adjusting ${rebalanceCandidates.length} category ${rebalanceCandidates.length === 1 ? "budget" : "budgets"}.`,
      recommendation: `Review the proposed adjustments (CURRENT → SUGGESTED) to align your monthly limits with your real campus spending habits.`,
      explanation: `Calculated from your actual transaction patterns across monitored categories over the past 3 months.`,
      supportingMetrics: {
        suggestedBudgets: rebalanceCandidates,
        currency: userCurrency,
      },
      actionType: "adjust_budget",
      actionPayload: {
        suggestedBudgets: rebalanceCandidates,
      },
      generatedAt: new Date(),
    });
  }

  // =========================================================================
  // 11. MONTH-END FORECAST & SPENDING DRIVERS (Rule 16)
  // =========================================================================
  if (totalExpense > 10 && currentDay >= 2) {
    const drivers = categoriesBreakdown
      .map((c) => ({
        categoryName: c.categoryName,
        amount: c.currentAmount,
        percent: totalExpense > 0 ? Math.round((c.currentAmount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const totalBudgetCap = activeBudgets.reduce((sum, b) => sum + b.limit, 0);
    let forecastPacingMsg = "";
    let priority = "medium";

    if (totalBudgetCap > 0 && projectedMonthEndExpense > totalBudgetCap) {
      const overBudget = projectedMonthEndExpense - totalBudgetCap;
      forecastPacingMsg = ` Projected to exceed your total budget cap by ~${formatAmount(overBudget, userCurrency)}.`;
      priority = "high";
    }

    generatedInsights.push({
      category: "understand",
      priority,
      insightType: "month_end_forecast",
      title: `📅 Month-end spending forecast`,
      summary: `At your current rate (${formatAmount(dailyBurnRate, userCurrency)}/day), you're projected to spend ${formatAmount(projectedMonthEndExpense, userCurrency)} this month.${forecastPacingMsg}`,
      recommendation: `Top spending drivers: ${drivers.map((d) => `${d.categoryName} (${formatAmount(d.amount, userCurrency)})`).join(", ")}.`,
      explanation: `Calculated deterministically based on ${currentDay} elapsed days with ${daysRemaining} days remaining in the billing cycle.`,
      supportingMetrics: {
        dailyBurnRate,
        projectedMonthEnd: projectedMonthEndExpense,
        currentAmount: totalExpense,
        drivers,
        currency: userCurrency,
      },
      actionType: "view_spending_drivers",
      actionPayload: {
        drivers,
        dailyBurnRate,
        projectedMonthEndExpense,
        totalExpense,
      },
      generatedAt: new Date(),
    });
  }

  // =========================================================================
  // 12. EMPTY / ALL CAUGHT UP STATE (Rule 35)
  // =========================================================================
  if (generatedInsights.length === 0) {
    generatedInsights.push({
      category: "understand",
      priority: "low",
      insightType: "all_caught_up",
      title: `✨ You're all caught up`,
      summary: `No unusual spending patterns or budget overruns were detected right now.`,
      recommendation: `Your spending velocity is steady and well-balanced. Keep recording your transactions and CampusCoin AI will highlight useful patterns when they appear.`,
      explanation: `All monitored categories are within historical baselines and budget limits.`,
      supportingMetrics: {
        currentAmount: totalExpense,
        currency: userCurrency,
      },
      actionType: "none",
      actionPayload: {},
      generatedAt: new Date(),
    });
  }

  // Sort by priority (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  generatedInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    financialProfile,
    deterministicInsights: generatedInsights,
    insights: generatedInsights,
    metrics: {
      totalIncome,
      totalExpense,
      netSurplus,
      dailyBurnRate,
      projectedMonthEndExpense,
      userCurrency,
    },
  };
};

/** Helper for formatting currency string nicely */
function formatAmount(amount, currency = "USD") {
  const code = (currency || "USD").toUpperCase();
  const num = Math.round(amount) || 0;
  if (code === "PKR") return `Rs. ${num.toLocaleString()}`;
  if (code === "EUR") return `€${num.toLocaleString()}`;
  return `$${num.toLocaleString()}`;
}

/** Helper to pick emoji based on category name */
function getCategoryEmoji(catName = "") {
  const name = catName.toLowerCase();
  if (name.includes("food") || name.includes("dining") || name.includes("eat") || name.includes("grocer")) return "🍔";
  if (name.includes("transport") || name.includes("transit") || name.includes("uber") || name.includes("bus")) return "🚕";
  if (name.includes("book") || name.includes("academic") || name.includes("course") || name.includes("tuition")) return "📚";
  if (name.includes("rent") || name.includes("hostel") || name.includes("dorm")) return "🏠";
  if (name.includes("entertain") || name.includes("movie") || name.includes("game")) return "🎮";
  if (name.includes("shop") || name.includes("cloth")) return "🛍️";
  if (name.includes("subscrip") || name.includes("netflix") || name.includes("spotify")) return "🧾";
  return "💡";
}

module.exports = {
  analyzeUserFinances,
  formatAmount,
  getCategoryEmoji,
};

