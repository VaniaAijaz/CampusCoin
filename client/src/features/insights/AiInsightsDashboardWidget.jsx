import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  AlertTriangle,
  TrendingUp,
  Target,
  Repeat,
  Info,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { getDashboardInsights, generateInsight } from "./insightsApi";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import toast from "react-hot-toast";

// Video-Accurate Physical Spatial Glass Standard Recipe
const glassCard =
  "base-glass glass-card rounded-3xl bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white transform-gpu backface-hidden";

export default function AiInsightsDashboardWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedWhyId, setExpandedWhyId] = useState(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dashboardInsights"],
    queryFn: getDashboardInsights,
    staleTime: 3 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: generateInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      toast.success("AI analyzed latest spending habits!");
    },
    onError: () => {
      toast.error("Failed to re-evaluate insights.");
    },
  });

  const insights = data?.insights || [];
  const totalCount = data?.totalCount || insights.length;
  const isRefreshing = isFetching || refreshMutation.isPending;

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case "take_action":
        return {
          pill: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          dot: "bg-rose-400",
          label: "Take Action",
          border: "hover:border-rose-500/30",
        };
      case "save":
        return {
          pill: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          dot: "bg-amber-400",
          label: "Save",
          border: "hover:border-amber-500/30",
        };
      case "grow":
        return {
          pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          dot: "bg-emerald-400",
          label: "Grow",
          border: "hover:border-emerald-500/30",
        };
      case "understand":
      default:
        return {
          pill: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          dot: "bg-sky-400",
          label: "Understand",
          border: "hover:border-sky-500/30",
        };
    }
  };

  const handleAction = (item) => {
    const { actionType, actionPayload, relatedCategoryName } = item;
    switch (actionType) {
      case "review_spending":
        if (actionPayload?.categoryId) {
          navigate(`/app/transactions?category=${encodeURIComponent(actionPayload.categoryName || relatedCategoryName || "")}`);
        } else {
          navigate("/app/transactions");
        }
        break;
      case "set_limit":
      case "adjust_budget":
        if (actionPayload?.categoryId) {
          navigate(`/app/budget?open=create&category=${encodeURIComponent(actionPayload.categoryName || relatedCategoryName || "")}&limit=${actionPayload.suggestedLimit || ""}`);
        } else {
          navigate("/app/budget");
        }
        break;
      case "create_savings_plan":
      case "create_emergency_goal":
        navigate("/app/insights");
        break;
      case "review_subscriptions":
        navigate("/app/subscriptions");
        break;
      case "view_spending_drivers":
        navigate("/app/insights");
        break;
      default:
        navigate("/app/insights");
    }
  };

  const getActionButtonLabel = (actionType) => {
    switch (actionType) {
      case "review_spending":
        return "Review Spending";
      case "set_limit":
        return "Set Limit";
      case "adjust_budget":
        return "Adjust Budget";
      case "create_savings_plan":
        return "Create Savings Plan";
      case "review_subscriptions":
        return "Review Subscriptions";
      case "view_spending_drivers":
        return "View Drivers";
      case "create_emergency_goal":
        return "Create Emergency Goal";
      default:
        return "Explore Insight";
    }
  };

  return (
    <div className={`${glassCard} p-6 sm:p-7 relative overflow-hidden transition-all duration-300`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-amber-400/30 to-brand-primary/30 border border-white/20 text-amber-300 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 drop-shadow-sm">
                AI Financial Insights
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white/90">
                {totalCount > 0 ? `${totalCount} recommendations` : "Copilot"}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5 font-medium">
              Data-grounded actionable advice tailored to your student spending velocity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white/90 transition-all cursor-pointer disabled:opacity-50 min-h-[36px]"
            title="Refresh analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-300" : ""}`} />
            <span>{isRefreshing ? "Analyzing..." : "Re-evaluate"}</span>
          </button>

          <Link
            to="/app/insights"
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-bold text-white transition-all shadow-sm min-h-[36px]"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/60 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-300" />
            <span>Analyzing campus spending patterns...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto" />
            <h4 className="text-sm font-bold text-white">✨ You're all caught up</h4>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              No unusual spending spikes or budget overruns detected right now. Keep recording your transactions to maintain your financial health score!
            </p>
          </div>
        ) : (
          insights.map((item) => {
            const theme = getCategoryTheme(item.category);
            const isWhyOpen = expandedWhyId === item._id;

            return (
              <div
                key={item._id}
                className={`p-4 sm:p-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 ${theme.border} transition-all space-y-3 relative`}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${theme.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                      {theme.label}
                    </span>

                    {item.priority === "high" && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase">
                        High Priority
                      </span>
                    )}
                  </div>

                  {item.generatedAt && (
                    <span className="text-[10px] text-white/50 font-medium">
                      {new Date(item.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Title & Summary */}
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed font-medium">
                    {item.summary}
                  </p>
                </div>

                {/* Recommendation Callout */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/15 text-xs text-white/90 leading-relaxed font-medium flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>{item.recommendation}</span>
                </div>

                {/* Actions & "Why?" row */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    {item.actionType && item.actionType !== "none" && (
                      <button
                        onClick={() => handleAction(item)}
                        className="px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer min-h-[34px]"
                      >
                        <span>{getActionButtonLabel(item.actionType)}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedWhyId(isWhyOpen ? null : item._id)}
                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-white/75 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[34px]"
                    >
                      <span>Why am I getting this?</span>
                      {isWhyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <Link
                    to="/app/insights"
                    className="text-[11px] font-bold text-sky-300 hover:text-sky-200 transition-colors flex items-center gap-1"
                  >
                    <span>Full Analysis</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Expandable "Why am I getting this?" breakdown */}
                <AnimatePresence>
                  {isWhyOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2"
                    >
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/15 space-y-2 text-xs text-white/80">
                        <div className="flex items-center gap-1.5 text-white font-bold text-xs border-b border-white/10 pb-1.5">
                          <Info className="w-3.5 h-3.5 text-sky-300" />
                          <span>Data Grounding & Verified Numbers</span>
                        </div>
                        <p className="leading-relaxed text-white/90">
                          {item.explanation}
                        </p>

                        {/* Supporting Numerical Metrics Pill Box */}
                        {item.supportingMetrics && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                            {item.supportingMetrics.currentAmount !== undefined && (
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-[10px] text-white/50 block font-semibold">Current Spend</span>
                                <span className="font-black text-white text-xs">
                                  {formatCurrency(item.supportingMetrics.currentAmount, item.supportingMetrics.currency || user?.currency)}
                                </span>
                              </div>
                            )}
                            {item.supportingMetrics.avgAmount !== undefined && (
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-[10px] text-white/50 block font-semibold">3-Mo Average</span>
                                <span className="font-black text-white text-xs">
                                  {formatCurrency(item.supportingMetrics.avgAmount, item.supportingMetrics.currency || user?.currency)}
                                </span>
                              </div>
                            )}
                            {item.supportingMetrics.percentChange !== undefined && (
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-[10px] text-white/50 block font-semibold">Difference</span>
                                <span className={`font-black text-xs ${item.supportingMetrics.percentChange > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                                  {item.supportingMetrics.percentChange > 0 ? "+" : ""}{item.supportingMetrics.percentChange}%
                                </span>
                              </div>
                            )}
                            {item.supportingMetrics.budgetLimit !== undefined && (
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-[10px] text-white/50 block font-semibold">Budget Limit</span>
                                <span className="font-black text-white text-xs">
                                  {formatCurrency(item.supportingMetrics.budgetLimit, item.supportingMetrics.currency || user?.currency)}
                                </span>
                              </div>
                            )}
                            {item.supportingMetrics.dailyBurnRate !== undefined && (
                              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-[10px] text-white/50 block font-semibold">Daily Velocity</span>
                                <span className="font-black text-white text-xs">
                                  {formatCurrency(item.supportingMetrics.dailyBurnRate, item.supportingMetrics.currency || user?.currency)}/day
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
