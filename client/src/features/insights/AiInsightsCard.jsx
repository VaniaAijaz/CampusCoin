import { useState } from "react";
import {
  Sparkles,
  Zap,
  TrendingDown,
  Flame,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { generateInsight, toggleBookmarkInsight } from "./insightsApi";
import toast from "react-hot-toast";

export default function AiInsightsCard({ insight, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(insight?.isBookmarked || false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await generateInsight();
      toast.success("AI analyzed latest student spending trends!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error("Failed to generate fresh insights.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!insight?._id) return;
    try {
      const res = await toggleBookmarkInsight(insight._id);
      if (res.success) {
        setBookmarked(res.insight.isBookmarked);
        toast.success(res.insight.isBookmarked ? "Insight bookmarked!" : "Bookmark removed");
      }
    } catch {
      toast.error("Could not update bookmark.");
    }
  };

  const velocity = insight?.spendingVelocity || {
    dailyBurnRate: 0,
    projectedMonthEndExpense: 0,
    velocityStatus: "safe",
  };

  const velocityConfig = {
    safe: {
      label: "Optimal Velocity",
      color: "text-brand-mint bg-brand-mint/10 border-brand-mint/20",
      desc: "Spending is well below total allowance.",
    },
    caution: {
      label: "Elevated Burn Rate",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      desc: "Spending pace will test monthly reserve.",
    },
    danger: {
      label: "Deficit Warning",
      color: "text-brand-coral bg-brand-coral/10 border-brand-coral/20",
      desc: "Projected month-end expenses exceed income.",
    },
  }[velocity.velocityStatus || "safe"];

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300 relative overflow-hidden">
      {/* Top subtle ambient glow */}
      <div className="absolute top-0 right-1/4 w-52 h-52 bg-brand-primary text-brand-dark/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-brand-primary to-brand-ai text-white shadow-lg shadow-brand-primary/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              AI Financial Copilot
              <span className="text-3xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary text-brand-dark/20 text-brand-primary/80 border border-brand-primary/30 font-semibold">
                Autonomous
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Plain-text, actionable financial advice derived from your spending velocity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {insight?._id && (
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                bookmarked
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
              }`}
              title="Bookmark insight"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-brand-primary text-brand-dark/30 hover:bg-brand-primary text-brand-dark/50 text-indigo-200 border border-brand-primary/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Re-evaluating..." : "Run AI Audit"}
          </button>
        </div>
      </div>

      {/* Spending Velocity Bar */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
          <span className="text-2xs text-zinc-400 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Daily Burn Velocity
          </span>
          <div className="mt-1 text-xl font-bold text-white">
            ${velocity.dailyBurnRate ? velocity.dailyBurnRate.toFixed(2) : "0.00"}
            <span className="text-2xs font-normal text-zinc-400"> /day</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
          <span className="text-2xs text-zinc-400 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-brand-primary" />
            Month-End Projected Spend
          </span>
          <div className="mt-1 text-xl font-bold text-white">
            ${velocity.projectedMonthEndExpense ? velocity.projectedMonthEndExpense.toFixed(2) : "0.00"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
          <span className="text-2xs text-zinc-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-mint" />
            Pacing Health State
          </span>
          <div className="mt-1">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${velocityConfig.color}`}>
              {velocityConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Plain Language Summary Paragraph */}
      <div className="mt-4 p-4 rounded-xl bg-indigo-950/20 border border-brand-primary/20 text-sm text-zinc-200 leading-relaxed">
        {insight?.summaryText || (
          <span className="text-zinc-400">
            Log your income and expenses to unlock autonomous velocity analysis and plain-text saving opportunities tailored to campus life.
          </span>
        )}
      </div>

      {/* Actionable Advice Cards */}
      <div className="mt-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Actionable Plain-Text Recommendations
        </h4>

        {insight?.actionableAdvice && insight.actionableAdvice.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insight.actionableAdvice.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white">{rec.title}</span>
                    <span
                      className={`text-3xs uppercase font-bold px-2 py-0.5 rounded-full border ${
                        rec.urgency === "high"
                          ? "bg-brand-coral/20 text-rose-300 border-brand-coral/30"
                          : rec.urgency === "medium"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-brand-mint/20 text-emerald-300 border-brand-mint/30"
                      }`}
                    >
                      {rec.urgency} priority
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{rec.action}</p>
                </div>
                {rec.impact && (
                  <div className="mt-3 pt-2 border-t border-white/5 text-2xs text-brand-mint font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Impact: {rec.impact}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-zinc-400 text-center">
            Click "Run AI Audit" to generate custom recommendations based on your current month habits.
          </div>
        )}
      </div>

      {/* Flagged Category Velocity Spikes */}
      {insight?.flaggedCategories && insight.flaggedCategories.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-coral flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-brand-coral" />
            Detected Velocity Spikes vs 3-Month Average
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {insight.flaggedCategories.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-rose-950/20 border border-brand-coral/20 text-xs"
              >
                <div className="font-semibold text-rose-200">{item.categoryName}</div>
                <div className="text-2xs text-zinc-400 mt-1">
                  Spent: <span className="text-white">${item.currentAmount.toFixed(2)}</span>
                  {" "}(+{item.percentChange}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
