const mongoose = require("mongoose");
const Insight = require("./Insight.model");
const Budget = require("../budgets/Budget.model");
const Category = require("../categories/Category.model");
const Transaction = require("../transactions/Transaction.model");
const { refreshUserInsights, getActiveInsightsForUser } = require("./insight.service");
const { analyzeUserFinances } = require("./insight.engine");
const { redisClient } = require("../../core/redis");
const { invalidateUserCache } = require("../../core/cacheMiddleware");
const CurrencyService = require("../../core/currency.service");

/**
 * GET /api/insights
 * Returns all active insights for the student with optional category filtering.
 */
const getInsights = async (req, res, next) => {
  try {
    const { category, bookmarked, includeDismissed } = req.query;

    const insights = await getActiveInsightsForUser(req.user._id, {
      category,
      isBookmarked: bookmarked === "true",
      includeDismissed: includeDismissed === "true",
    });

    res.json({
      success: true,
      insights,
      count: insights.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/insights/dashboard
 * Returns top 2-3 prioritized active recommendations for the dashboard widget.
 */
const getDashboardInsights = async (req, res, next) => {
  try {
    const allInsights = await getActiveInsightsForUser(req.user._id, {
      includeDismissed: false,
    });

    // Pick top 2-3 most relevant insights
    const prioritized = (allInsights || []).slice(0, 3);

    res.json({
      success: true,
      insights: prioritized,
      totalCount: allInsights.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/insights/generate
 * Forces a fresh analysis of the student's real financial data.
 */
const generateInsights = async (req, res, next) => {
  try {
    const insights = await refreshUserInsights(req.user._id);

    res.json({
      success: true,
      message: "AI insights generated successfully.",
      insights,
      count: insights.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/insights/:id/dismiss
 * Dismisses an insight from the active recommendations feed.
 */
const dismissInsight = async (req, res, next) => {
  try {
    const insight = await Insight.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "Insight not found.",
      });
    }

    insight.isDismissed = true;
    await insight.save();

    res.json({
      success: true,
      message: "Insight dismissed.",
      insight,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/insights/:id/bookmark
 * Toggles bookmark status of an insight.
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const insight = await Insight.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "Insight not found.",
      });
    }

    insight.isBookmarked = !insight.isBookmarked;
    await insight.save();

    res.json({
      success: true,
      isBookmarked: insight.isBookmarked,
      insight,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/insights/:id/pin
 * Toggles pinned status of an insight.
 */
const togglePin = async (req, res, next) => {
  try {
    const insight = await Insight.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "Insight not found.",
      });
    }

    insight.isPinned = !insight.isPinned;
    await insight.save();

    res.json({
      success: true,
      isPinned: insight.isPinned,
      insight,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/insights/forecast
 * Deterministic month-end forecast with spending drivers breakdown.
 */
const getForecast = async (req, res, next) => {
  try {
    const { metrics, insights } = await analyzeUserFinances(req.user._id);
    const forecastInsight = insights.find((i) => i.insightType === "month_end_forecast");

    res.json({
      success: true,
      forecast: {
        dailyBurnRate: metrics.dailyBurnRate,
        projectedMonthEndExpense: metrics.projectedMonthEndExpense,
        totalIncome: metrics.totalIncome,
        totalExpense: metrics.totalExpense,
        netSurplus: metrics.netSurplus,
        currency: metrics.userCurrency,
        drivers: forecastInsight?.supportingMetrics?.drivers || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/insights/apply-budgets
 * Applies confirmed budget adjustments after user review.
 */
const applyBudgetAdjustments = async (req, res, next) => {
  try {
    let suggestedBudgets = req.body?.suggestedBudgets || req.body;

    // Handle single object or wrapped payload
    if (!Array.isArray(suggestedBudgets)) {
      if (suggestedBudgets && typeof suggestedBudgets === "object") {
        if (suggestedBudgets.categoryId || suggestedBudgets.categoryName || suggestedBudgets.suggestedLimit || suggestedBudgets.limitAmount) {
          suggestedBudgets = [suggestedBudgets];
        } else {
          suggestedBudgets = [];
        }
      } else {
        suggestedBudgets = [];
      }
    }

    if (suggestedBudgets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A list of valid budget adjustments is required.",
      });
    }

    const userCurrency = CurrencyService.getUserCurrency(req.user);
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const updatedBudgets = [];

    for (const item of suggestedBudgets) {
      let targetCategoryId = item.categoryId || item.category_id || item._id;
      const limitVal = item.suggestedLimit !== undefined ? item.suggestedLimit : (item.limitAmount !== undefined ? item.limitAmount : item.limit);

      // If categoryId is missing, resolve by categoryName
      if (!targetCategoryId && item.categoryName) {
        const foundCat = await Category.findOne({
          name: new RegExp(`^${item.categoryName.trim()}$`, "i"),
          $or: [{ userId: req.user._id }, { isDefault: true }, { userId: null }],
        });
        if (foundCat) {
          targetCategoryId = foundCat._id;
        }
      }

      if (targetCategoryId && Number(limitVal) > 0) {
        // Convert to base USD currency for database storage
        const baseLimit = CurrencyService.toBase(Number(limitVal), userCurrency);

        // Aggregate current monthly spending in base currency (USD)
        const spentRes = await Transaction.aggregate([
          {
            $match: {
              userId: req.user._id,
              categoryId: new mongoose.Types.ObjectId(targetCategoryId),
              type: "expense",
              date: { $gte: currentMonthDate, $lte: endOfMonth },
              isDeleted: false,
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const spentAmountInBase = spentRes[0]?.total || 0;

        const budget = await Budget.findOneAndUpdate(
          {
            userId: req.user._id,
            categoryId: targetCategoryId,
            month: currentMonthDate,
          },
          {
            limitAmount: baseLimit,
            spentAmount: spentAmountInBase,
            alertSent: false,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate("categoryId", "name icon color type isDefault");

        updatedBudgets.push(budget);
      }
    }

    if (updatedBudgets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid category IDs or budget limits were supplied to update.",
      });
    }

    await invalidateUserCache(req.user._id);

    // Refresh user insights to reflect new budget limits
    await refreshUserInsights(req.user._id);

    res.json({
      success: true,
      message: `Successfully updated ${updatedBudgets.length} budget ${updatedBudgets.length === 1 ? "limit" : "limits"}.`,
      budgets: updatedBudgets,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/insights/dynamic
 * Returns single dynamic AI tip for quick-access widgets.
 */
const getDynamicTip = async (req, res, next) => {
  try {
    const insights = await getActiveInsightsForUser(req.user._id, {
      includeDismissed: false,
    });

    const top = insights[0];
    const tip = top
      ? `${top.title}: ${top.recommendation}`
      : "Log your daily transactions to receive smart student budgeting recommendations.";

    res.json({
      success: true,
      tip,
      insight: top || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/insights/dynamic/regenerate
 * Forces dynamic tip regeneration.
 */
const regenerateDynamicTip = async (req, res, next) => {
  try {
    const insights = await refreshUserInsights(req.user._id);
    const top = insights[0];
    const tip = top
      ? `${top.title}: ${top.recommendation}`
      : "Keep tracking your daily expenses to unlock intelligent savings tips.";

    res.json({
      success: true,
      tip,
      insight: top || null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInsights,
  getDashboardInsights,
  generateInsights,
  dismissInsight,
  toggleBookmark,
  togglePin,
  getForecast,
  applyBudgetAdjustments,
  getDynamicTip,
  regenerateDynamicTip,
};
