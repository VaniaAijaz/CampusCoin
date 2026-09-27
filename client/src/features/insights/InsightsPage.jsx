import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  Bookmark,
  Pin,
  X,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  Target,
  Repeat,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  Sliders,
  DollarSign,
  Plus,
  Minus,
  Check,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getInsights,
  generateInsight,
  dismissInsight,
  toggleBookmarkInsight,
  togglePinInsight,
  applyBudgetAdjustments,
} from "./insightsApi";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";

// Video-Accurate Physical Spatial Glass Standard Recipe
const glassCard =
  "base-glass glass-card rounded-3xl bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white transform-gpu backface-hidden";

export default function InsightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [expandedWhyIds, setExpandedWhyIds] = useState({});
  const [goalContributions, setGoalContributions] = useState({});
  const [rebalanceModalItem, setRebalanceModalItem] = useState(null);
  const [driversModalItem, setDriversModalItem] = useState(null);

  // Fetch all insights
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["insightsList", activeTab],
    queryFn: () =>
      getInsights({
        category: activeTab === "all" || activeTab === "bookmarked" ? undefined : activeTab,
        bookmarked: activeTab === "bookmarked" ? "true" : undefined,
      }),
    staleTime: 3 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: generateInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
      toast.success("AI Copilot recalculated your financial patterns!");
    },
    onError: () => {
      toast.error("Failed to re-evaluate insights.");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
      toast.success("Recommendation dismissed from active feed.");
    },
    onError: () => {
      toast.error("Could not dismiss recommendation.");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmarkInsight,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      toast.success(res.isBookmarked ? "Insight bookmarked!" : "Bookmark removed.");
    },
  });

  const pinMutation = useMutation({
    mutationFn: togglePinInsight,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      toast.success(res.isPinned ? "Insight pinned to top!" : "Insight unpinned.");
    },
  });

  const applyBudgetsMutation = useMutation({
    mutationFn: applyBudgetAdjustments,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
      queryClient.invalidateQueries({ queryKey: ["budgetsData"] });
      setRebalanceModalItem(null);
      toast.success(res.message || "Budget caps updated successfully!");
    },
    onError: () => {
      toast.error("Failed to apply budget adjustments.");
    },
  });

  const allInsights = data?.insights || [];
  const isRefreshing = isFetching || refreshMutation.isPending;

  // Filter tabs
  const tabs = [
    { id: "all", label: "All Insights", icon: Layers, count: allInsights.length },
    { id: "take_action", label: "Take Action", dotColor: "bg-rose-400", count: allInsights.filter((i) => i.category === "take_action").length },
    { id: "save", label: "Save", dotColor: "bg-amber-400", count: allInsights.filter((i) => i.category === "save").length },
    { id: "grow", label: "Grow", dotColor: "bg-emerald-400", count: allInsights.filter((i) => i.category === "grow").length },
    { id: "understand", label: "Understand", dotColor: "bg-sky-400", count: allInsights.filter((i) => i.category === "understand").length },
    { id: "bookmarked", label: "Saved", icon: Bookmark, count: allInsights.filter((i) => i.isBookmarked).length },
  ];

  const displayedInsights = useMemo(() => {
    if (activeTab === "bookmarked") {
      return allInsights.filter((i) => i.isBookmarked);
    }
    if (activeTab !== "all") {
      return allInsights.filter((i) => i.category === activeTab);
    }
    return allInsights;
  }, [allInsights, activeTab]);

  const toggleWhy = (id) => {
    setExpandedWhyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case "take_action":
        return {
          pill: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          dot: "bg-rose-400",
          label: "Take Action",
          border: "border-rose-500/30",
          badge: "bg-rose-500/25",
        };
      case "save":
        return {
          pill: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          dot: "bg-amber-400",
          label: "Save",
          border: "border-amber-500/30",
          badge: "bg-amber-500/25",
        };
      case "grow":
        return {
          pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          dot: "bg-emerald-400",
          label: "Grow",
          border: "border-emerald-500/30",
          badge: "bg-emerald-500/25",
        };
      case "understand":
      default:
        return {
          pill: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          dot: "bg-sky-400",
          label: "Understand",
          border: "border-sky-500/30",
          badge: "bg-sky-500/25",
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
        if (actionPayload?.suggestedBudgets) {
          setRebalanceModalItem(item);
        } else if (actionPayload?.categoryId) {
          navigate(`/app/budget?open=create&category=${encodeURIComponent(actionPayload.categoryName || relatedCategoryName || "")}&limit=${actionPayload.suggestedLimit || actionPayload.limitAmount || ""}`);
        } else {
          navigate("/app/budget");
        }
        break;
      case "create_savings_plan":
        // Interactive calculator is inside the card
        break;
      case "review_subscriptions":
        navigate("/app/subscriptions");
        break;
      case "view_spending_drivers":
        setDriversModalItem(item);
        break;
      case "create_emergency_goal":
        toast("Navigate to your goals section to set your student emergency fund!", { icon: "🛡️" });
        break;
      default:
        break;
    }
  };

  // Interactive Monthly Contribution Stepper Helper for Savings Goal cards
  const getGoalMath = (item) => {
    const target = item.supportingMetrics?.goalTarget || 100000;
    const saved = item.supportingMetrics?.goalSaved || 0;
    const remaining = Math.max(0, target - saved);

    const initialMonthly = item.supportingMetrics?.suggestedMonthly || Math.max(10, Math.round(remaining / 12));
    const currentContribution = goalContributions[item._id] !== undefined ? goalContributions[item._id] : initialMonthly;

    const months = currentContribution > 0 ? Math.max(1, Math.ceil(remaining / currentContribution)) : 0;

    return {
      target,
      saved,
      remaining,
      monthly: currentContribution,
      months,
      step: Math.max(5, Math.round(target / 20)),
    };
  };

  const adjustGoalMonthly = (itemId, delta, item) => {
    const { monthly, step } = getGoalMath(item);
    const newMonthly = Math.max(5, monthly + delta * step);
    setGoalContributions((prev) => ({ ...prev, [itemId]: newMonthly }));
  };

  return (
    <div className="space-y-6 w-full text-white pb-12">
      {/* ─── Hero Header & Summary Stats ─── */}
      <div className={`${glassCard} p-6 sm:p-8 relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-brand-primary text-brand-dark shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-sm">
                  AI Financial Insights & Copilot
                </h2>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5 font-medium">
                  Verified deterministic calculations with AI-guided explanations and actionable advice
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-300" : ""}`} />
            <span>{isRefreshing ? "Analyzing Live Data..." : "Run AI Audit"}</span>
          </button>
        </div>

        {/* Top 3 Metric Counter Badges */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">Action Items</span>
              <span className="text-xl font-black text-white">
                {allInsights.filter((i) => i.category === "take_action").length} Attention Flag{allInsights.filter((i) => i.category === "take_action").length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">Saving Opportunities</span>
              <span className="text-xl font-black text-white">
                {allInsights.filter((i) => i.category === "save").length} Detected
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">Growth & Reserves</span>
              <span className="text-xl font-black text-white">
                {allInsights.filter((i) => i.category === "grow").length} Strategy Plan{allInsights.filter((i) => i.category === "grow").length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Category Filter Navigation Tabs ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[40px] ${
                isActive
                  ? "bg-white/25 border border-white/40 text-white shadow-md shadow-black/20"
                  : "bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white"
              }`}
            >
              {TabIcon ? (
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-amber-300" : "text-white/60"}`} />
              ) : tab.dotColor ? (
                <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
              ) : null}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/60"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Insights Cards Grid / Feed ─── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-white/60 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-300" />
          <span>Analyzing transactions, categories, and monthly limits...</span>
        </div>
      ) : displayedInsights.length === 0 ? (
        <div className={`${glassCard} p-10 text-center space-y-3`}>
          <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-base font-bold text-white">No active recommendations in this category</h3>
          <p className="text-xs text-white/60 max-w-md mx-auto">
            {activeTab === "bookmarked"
              ? "You haven't bookmarked any insights yet. Click the bookmark icon on any recommendation to save it here."
              : "Everything looks healthy and balanced! Keep recording your daily transactions to maintain your financial score."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedInsights.map((item) => {
            const theme = getCategoryTheme(item.category);
            const isWhyOpen = Boolean(expandedWhyIds[item._id]);
            const isGoalCard = item.insightType === "savings_goal";
            const isRebalanceCard = item.insightType === "budget_adjustment";
            const goalMath = isGoalCard ? getGoalMath(item) : null;

            return (
              <div
                key={item._id}
                className={`${glassCard} p-6 flex flex-col justify-between space-y-4 border ${item.isPinned ? "border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.15)]" : "border-white/10"} hover:border-white/25 transition-all relative overflow-hidden`}
              >
                {item.isPinned && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-black px-3 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <Pin className="w-3 h-3 fill-black" /> Pinned
                  </div>
                )}

                <div>
                  {/* Category Pill & Action Buttons Bar */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${theme.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                        {theme.label}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          item.priority === "high"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            : item.priority === "medium"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => bookmarkMutation.mutate(item._id)}
                        className={`p-2 rounded-full border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                          item.isBookmarked
                            ? "bg-amber-500/25 border-amber-500/50 text-amber-300"
                            : "bg-white/5 hover:bg-white/15 border-white/15 text-white/60 hover:text-white"
                        }`}
                        title={item.isBookmarked ? "Remove Bookmark" : "Bookmark Insight"}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => pinMutation.mutate(item._id)}
                        className={`p-2 rounded-full border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                          item.isPinned
                            ? "bg-amber-400/30 border-amber-400/60 text-amber-300"
                            : "bg-white/5 hover:bg-white/15 border-white/15 text-white/60 hover:text-white"
                        }`}
                        title={item.isPinned ? "Unpin from Top" : "Pin to Top"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => dismissMutation.mutate(item._id)}
                        className="p-2 rounded-full bg-white/5 hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/30 text-white/60 hover:text-rose-300 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Dismiss Recommendation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div className="mt-3.5 space-y-1.5">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/80 leading-relaxed font-medium">
                      {item.summary}
                    </p>
                  </div>

                  {/* Recommendation Callout */}
                  <div className="mt-3.5 p-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-xs text-white/95 leading-relaxed font-medium flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block mb-0.5">
                        AI Recommendation
                      </span>
                      <span>{item.recommendation}</span>
                    </div>
                  </div>

                  {/* ─── Interactive Savings Goal Scenario Widget ─── */}
                  {isGoalCard && goalMath && (
                    <div className="mt-4 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-300 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> Dynamic Timeline Calculator
                        </span>
                        <span className="text-white">
                          Est. completion: <strong>~{goalMath.months} months</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-xs text-white/70 font-medium">Monthly Contribution:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => adjustGoalMonthly(item._id, -1, item)}
                            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-sm text-emerald-300 min-w-[70px] text-center">
                            {formatCurrency(goalMath.monthly, item.supportingMetrics?.currency || user?.currency)}
                          </span>
                          <button
                            onClick={() => adjustGoalMonthly(item._id, 1, item)}
                            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-white/70 leading-normal">
                        At {formatCurrency(goalMath.monthly, item.supportingMetrics?.currency || user?.currency)}/month, you will accumulate the remaining {formatCurrency(goalMath.remaining, item.supportingMetrics?.currency || user?.currency)} in approximately {goalMath.months} months.
                      </p>
                    </div>
                  )}

                  {/* ─── Budget Adjustment Rebalancing Preview ─── */}
                  {isRebalanceCard && item.actionPayload?.suggestedBudgets && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-2.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-sky-300" /> Proposed Category Rebalancing
                      </span>

                      <div className="space-y-1.5 text-xs">
                        {item.actionPayload.suggestedBudgets.map((b, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                            <span className="font-semibold text-white/90">{b.categoryName}</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-white/60 line-through">
                                {formatCurrency(b.currentLimit, item.supportingMetrics?.currency || user?.currency)}
                              </span>
                              <span className="text-sky-300 font-bold">→</span>
                              <span className="text-emerald-300 font-bold">
                                {formatCurrency(b.suggestedLimit, item.supportingMetrics?.currency || user?.currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Bottom Actions & "Why am I getting this?" Toggle ─── */}
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {item.actionType && item.actionType !== "none" && (
                        <button
                          onClick={() => handleAction(item)}
                          className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                        >
                          {item.actionType === "review_spending" && <span>Review Spending</span>}
                          {item.actionType === "set_limit" && <span>Set Limit</span>}
                          {item.actionType === "adjust_budget" && <span>{isRebalanceCard ? "Review & Apply" : "Adjust Budget"}</span>}
                          {item.actionType === "create_savings_plan" && <span>Save Toward Goal</span>}
                          {item.actionType === "review_subscriptions" && <span>Review Subscriptions</span>}
                          {item.actionType === "view_spending_drivers" && <span>View Drivers</span>}
                          {item.actionType === "create_emergency_goal" && <span>Create Emergency Goal</span>}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleWhy(item._id)}
                        className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-white/75 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer min-h-[38px]"
                      >
                        <span>Why am I getting this?</span>
                        {isWhyOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Explanation Breakdown */}
                  <AnimatePresence>
                    {isWhyOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl bg-black/50 border border-white/20 space-y-3 text-xs text-white/80">
                          <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-white/10">
                            <Info className="w-4 h-4 text-sky-300" />
                            <span>Data Grounding & Statistical Metrics</span>
                          </div>

                          <p className="leading-relaxed text-white/90">
                            {item.explanation}
                          </p>

                          {/* Supporting Numerical Metrics Pill Box */}
                          {item.supportingMetrics && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                              {item.supportingMetrics.currentAmount !== undefined && (
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <span className="text-[10px] text-white/50 block font-semibold">Current Spend</span>
                                  <span className="font-black text-white text-xs">
                                    {formatCurrency(item.supportingMetrics.currentAmount, item.supportingMetrics.currency || user?.currency)}
                                  </span>
                                </div>
                              )}

                              {item.supportingMetrics.avgAmount !== undefined && (
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <span className="text-[10px] text-white/50 block font-semibold">3-Mo Average</span>
                                  <span className="font-black text-white text-xs">
                                    {formatCurrency(item.supportingMetrics.avgAmount, item.supportingMetrics.currency || user?.currency)}
                                  </span>
                                </div>
                              )}

                              {item.supportingMetrics.lastMonthAmount !== undefined && (
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <span className="text-[10px] text-white/50 block font-semibold">Last Month</span>
                                  <span className="font-black text-white text-xs">
                                    {formatCurrency(item.supportingMetrics.lastMonthAmount, item.supportingMetrics.currency || user?.currency)}
                                  </span>
                                </div>
                              )}

                              {item.supportingMetrics.percentChange !== undefined && (
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <span className="text-[10px] text-white/50 block font-semibold">Variance %</span>
                                  <span className={`font-black text-xs ${item.supportingMetrics.percentChange > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                                    {item.supportingMetrics.percentChange > 0 ? "+" : ""}{item.supportingMetrics.percentChange}%
                                  </span>
                                </div>
                              )}

                              {item.supportingMetrics.budgetLimit !== undefined && (
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <span className="text-[10px] text-white/50 block font-semibold">Budget Limit</span>
                                  <span className="font-black text-white text-xs">
                                    {formatCurrency(item.supportingMetrics.budgetLimit, item.supportingMetrics.currency || user?.currency)}
                                  </span>
                                </div>
                              )}

                              {item.supportingMetrics.dailyBurnRate !== undefined && (
                                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                  <span className="text-[10px] text-white/50 block font-semibold">Burn Velocity</span>
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
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Rebalance Confirmation Modal (Review & Apply) ─── */}
      {rebalanceModalItem && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className={`${glassCard} p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl relative`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-sky-300" /> Review & Apply Budget Adjustments
                </h3>
                <button
                  onClick={() => setRebalanceModalItem(null)}
                  className="p-1 rounded-lg text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-white/80 leading-relaxed">
                CampusCoin AI recommends adjusting the following monthly category limits based on your actual spending patterns:
              </p>

              <div className="space-y-2 py-2">
                {(() => {
                  const budgetsList = rebalanceModalItem.actionPayload?.suggestedBudgets?.length
                    ? rebalanceModalItem.actionPayload.suggestedBudgets
                    : (rebalanceModalItem.actionPayload?.categoryId || rebalanceModalItem.relatedCategoryId ? [{
                        categoryId: rebalanceModalItem.actionPayload?.categoryId || rebalanceModalItem.relatedCategoryId,
                        categoryName: rebalanceModalItem.actionPayload?.categoryName || rebalanceModalItem.relatedCategoryName || "Category",
                        currentLimit: rebalanceModalItem.actionPayload?.limitAmount || rebalanceModalItem.supportingMetrics?.budgetLimit || 0,
                        suggestedLimit: rebalanceModalItem.actionPayload?.suggestedLimit || rebalanceModalItem.supportingMetrics?.budgetLimit || 0,
                      }] : []);

                  if (budgetsList.length === 0) {
                    return (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 text-center">
                        No specific budget adjustments detected for this insight.
                      </div>
                    );
                  }

                  return budgetsList.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="font-bold text-white">{b.categoryName}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-white/50 line-through">
                          {formatCurrency(b.currentLimit, rebalanceModalItem.supportingMetrics?.currency || user?.currency)}
                        </span>
                        <span className="text-sky-300 font-bold">→</span>
                        <span className="text-emerald-300 font-black text-sm">
                          {formatCurrency(b.suggestedLimit, rebalanceModalItem.supportingMetrics?.currency || user?.currency)}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <p className="text-[11px] text-white/60 leading-relaxed italic">
                * Note: Applying this change will update your active category budget targets in the Budget tab. You can manually adjust them anytime.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setRebalanceModalItem(null)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const budgetsList = rebalanceModalItem.actionPayload?.suggestedBudgets?.length
                      ? rebalanceModalItem.actionPayload.suggestedBudgets
                      : (rebalanceModalItem.actionPayload?.categoryId || rebalanceModalItem.relatedCategoryId ? [{
                          categoryId: rebalanceModalItem.actionPayload?.categoryId || rebalanceModalItem.relatedCategoryId,
                          categoryName: rebalanceModalItem.actionPayload?.categoryName || rebalanceModalItem.relatedCategoryName || "Category",
                          currentLimit: rebalanceModalItem.actionPayload?.limitAmount || rebalanceModalItem.supportingMetrics?.budgetLimit || 0,
                          suggestedLimit: rebalanceModalItem.actionPayload?.suggestedLimit || rebalanceModalItem.supportingMetrics?.budgetLimit || 0,
                        }] : []);
                    if (budgetsList.length > 0) {
                      applyBudgetsMutation.mutate(budgetsList);
                    } else {
                      toast.error("No valid budgets to apply.");
                    }
                  }}
                  disabled={applyBudgetsMutation.isPending}
                  className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  {applyBudgetsMutation.isPending ? "Applying..." : "Confirm & Apply"}
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── Forecast Spending Drivers Modal ─── */}
      {driversModalItem && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className={`${glassCard} p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl relative`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-primary" /> Month-End Spending Drivers
                </h3>
                <button
                  onClick={() => setDriversModalItem(null)}
                  className="p-1 rounded-lg text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-white/80 leading-relaxed">
                Categories contributing most significantly to your projected month-end spend:
              </p>

              <div className="space-y-2.5 py-2">
                {driversModalItem.actionPayload?.drivers?.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{d.categoryName}</span>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(d.amount, driversModalItem.supportingMetrics?.currency || user?.currency)} ({d.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                        style={{ width: `${Math.min(100, d.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-white/10">
                <button
                  onClick={() => setDriversModalItem(null)}
                  className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
