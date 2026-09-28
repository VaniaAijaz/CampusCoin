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
  Search,
  ArrowLeftRight,
  PieChart,
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
import AdSenseAd from "../../components/ads/AdSenseAd";

/* ── Canonical CampusCoin Design Tokens ── */
const C = {
  hero: "oklch(0.115 0.018 255)",
  heroFg: "oklch(0.985 0.003 250)",
  heroMuted: "oklch(0.73 0.018 252)",
  heroLine: "oklch(0.31 0.025 255)",
  brand: "oklch(0.59 0.22 262)",
  brandSoft: "oklch(0.93 0.06 262)",
  highlight: "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth: "oklch(0.64 0.17 157)",
  growthSoft: "oklch(0.94 0.05 158)",
  background: "oklch(0.99 0.003 250)",
  foreground: "oklch(0.16 0.025 260)",
  muted: "oklch(0.5 0.025 255)",
  border: "oklch(0.9 0.012 255)",
  altBg: "oklch(0.965 0.01 254)",

  // Category Semantic Accents
  takeAction: "#e11d48",
  takeActionSoft: "#ffe4e6",
  takeActionBorder: "#fecdd3",
  save: "#d97706",
  saveSoft: "#fef3c7",
  saveBorder: "#fde68a",
  grow: "#059669",
  growSoft: "#d1fae5",
  growBorder: "#a7f3d0",
  understand: "#2563eb",
  understandSoft: "#dbeafe",
  understandBorder: "#bfdbfe",
};

const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };
const inputSt = {
  width: "100%",
  padding: "9px 14px",
  borderRadius: 999,
  background: C.altBg,
  border: `1.5px solid ${C.border}`,
  fontSize: 13,
  color: C.foreground,
  outline: "none",
  fontFamily: M.fontFamily,
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

export default function InsightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [expandedWhyIds, setExpandedWhyIds] = useState({});
  const [goalContributions, setGoalContributions] = useState({});
  const [rebalanceModalItem, setRebalanceModalItem] = useState(null);
  const [driversModalItem, setDriversModalItem] = useState(null);
  const [applyingBudgets, setApplyingBudgets] = useState(false);

  // Fetch insights
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

  const insights = data?.insights || [];
  const cur = user?.currency || "USD";
  const isRefreshing = isFetching || refreshMutation.isPending;

  // Filter & Stats Summary
  const stats = useMemo(() => {
    let takeActionCount = 0;
    let saveCount = 0;
    let growCount = 0;
    let understandCount = 0;
    let highPriorityCount = 0;

    insights.forEach((item) => {
      if (item.category === "take_action") takeActionCount++;
      else if (item.category === "save") saveCount++;
      else if (item.category === "grow") growCount++;
      else if (item.category === "understand") understandCount++;
      if (item.priority === "high") highPriorityCount++;
    });

    return {
      total: insights.length,
      takeActionCount,
      saveCount,
      growCount,
      understandCount,
      highPriorityCount,
      healthLabel:
        highPriorityCount > 0
          ? `${highPriorityCount} High Alert`
          : takeActionCount > 0
          ? "Action Needed"
          : "Healthy & Stable",
    };
  }, [insights]);

  const toggleWhy = (id) => {
    setExpandedWhyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryConfig = (cat) => {
    switch (cat) {
      case "take_action":
        return {
          label: "Take Action",
          color: C.takeAction,
          bg: C.takeActionSoft,
          border: C.takeActionBorder,
          icon: AlertTriangle,
        };
      case "save":
        return {
          label: "Save",
          color: C.save,
          bg: C.saveSoft,
          border: C.saveBorder,
          icon: Flame,
        };
      case "grow":
        return {
          label: "Grow",
          color: C.grow,
          bg: C.growSoft,
          border: C.growBorder,
          icon: Target,
        };
      case "understand":
      default:
        return {
          label: "Understand",
          color: C.understand,
          bg: C.understandSoft,
          border: C.understandBorder,
          icon: Info,
        };
    }
  };

  const handleAction = (item) => {
    const { actionType, actionPayload, relatedCategoryName } = item;
    switch (actionType) {
      case "review_spending":
        if (actionPayload?.categoryId) {
          navigate(
            `/app/transactions?categoryId=${actionPayload.categoryId}&category=${encodeURIComponent(
              actionPayload.categoryName || relatedCategoryName || ""
            )}`
          );
        } else {
          navigate("/app/transactions");
        }
        break;

      case "set_limit":
      case "adjust_budget":
        if (actionPayload?.suggestedBudgets?.length) {
          setRebalanceModalItem(item);
        } else if (actionPayload?.categoryId) {
          navigate(
            `/app/budgets?open=create&categoryId=${actionPayload.categoryId}&category=${encodeURIComponent(
              actionPayload.categoryName || ""
            )}&limit=${actionPayload.suggestedLimit || ""}`
          );
        } else {
          navigate("/app/budgets");
        }
        break;

      case "create_savings_plan":
      case "open_savings_goals":
        navigate("/app/savings");
        break;

      case "review_subscriptions":
        navigate("/app/subscriptions");
        break;

      case "view_spending_drivers":
        if (item.supportingMetrics?.drivers?.length) {
          setDriversModalItem(item);
        } else {
          navigate("/app/transactions");
        }
        break;

      default:
        navigate("/app/transactions");
        break;
    }
  };

  const handleApplyRebalance = async () => {
    if (!rebalanceModalItem?.supportingMetrics?.suggestedBudgets?.length) return;
    setApplyingBudgets(true);
    try {
      const res = await applyBudgetAdjustments({
        adjustments: rebalanceModalItem.supportingMetrics.suggestedBudgets,
        insightId: rebalanceModalItem._id,
      });
      if (res.success) {
        toast.success("Budgets adjusted successfully!");
        setRebalanceModalItem(null);
        queryClient.invalidateQueries({ queryKey: ["insightsList"] });
        queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply budget adjustments.");
    } finally {
      setApplyingBudgets(false);
    }
  };

  return (
    <div style={{ ...M, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: C.brand,
              margin: "0 0 6px",
            }}
          >
            Financial Intelligence
          </p>
          <h1
            style={{
              fontSize: "clamp(1.6rem,4vw,2.4rem)",
              fontWeight: 900,
              color: C.foreground,
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            AI Financial Insights
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "6px 0 0", fontWeight: 500 }}>
            Personalized, explainable financial analysis powered by your real data.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 42,
              padding: "0 22px",
              borderRadius: 999,
              background: C.highlight,
              color: C.highlightFg,
              border: "none",
              fontSize: 14,
              fontWeight: 800,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              ...M,
              boxShadow: `0 4px 16px ${C.highlight}55`,
              transition: "background 0.15s",
              opacity: isRefreshing ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) e.currentTarget.style.background = "oklch(0.82 0.18 157)";
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) e.currentTarget.style.background = C.highlight;
            }}
          >
            <RefreshCw
              style={{
                width: 15,
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {isRefreshing ? "Analyzing Patterns..." : "Re-evaluate Insights"}
          </button>
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          borderRadius: 8,
          background: C.hero,
          position: "relative",
          overflow: "hidden",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.12,
            backgroundImage: `linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `${C.highlight}22`,
              border: `1.5px solid ${C.highlight}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.highlight,
            }}
          >
            <Sparkles style={{ width: 18 }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.heroFg }}>
                CampusCoin Copilot
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: `${C.highlight}22`,
                  color: C.highlight,
                  border: `1px solid ${C.highlight}44`,
                }}
              >
                100% Deterministic & Personalized
              </span>
            </div>
            <p style={{ fontSize: 12, color: C.heroMuted, margin: "2px 0 0", fontWeight: 500 }}>
              Continuous evaluation against your verified spending history, active limits, and goals.
            </p>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: C.heroMuted, fontWeight: 500 }}>
            {stats.total} recommendation{stats.total !== 1 ? "s" : ""} generated
          </span>
        </div>
      </div>

      {/* ── KPI SUMMARY STRIP ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 0,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          overflow: "hidden",
          background: C.border,
        }}
      >
        {[
          {
            label: "Active Insights",
            value: stats.total,
            raw: true,
            accent: C.brand,
            soft: C.brandSoft,
            icon: Sparkles,
          },
          {
            label: "Take Action Alerts",
            value: stats.takeActionCount,
            raw: true,
            accent: C.takeAction,
            soft: C.takeActionSoft,
            icon: AlertTriangle,
          },
          {
            label: "Savings & Growth",
            value: stats.saveCount + stats.growCount,
            raw: true,
            accent: C.growth,
            soft: C.growthSoft,
            icon: Target,
          },
          {
            label: "Copilot Status",
            value: stats.healthLabel,
            raw: true,
            accent: stats.highPriorityCount > 0 ? C.takeAction : C.growth,
            soft: stats.highPriorityCount > 0 ? C.takeActionSoft : C.growthSoft,
            icon: Shield,
          },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", padding: "18px 20px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: s.soft,
                color: s.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <s.icon style={{ width: 16 }} />
            </div>
            <div
              style={{
                fontSize: "clamp(1.2rem,2.4vw,1.7rem)",
                fontWeight: 900,
                color: s.accent,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {s.value}
            </div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: 0,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── CATEGORY FILTER TABS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All Insights", count: stats.total },
          { id: "take_action", label: "Take Action", count: stats.takeActionCount },
          { id: "save", label: "Save", count: stats.saveCount },
          { id: "grow", label: "Grow", count: stats.growCount },
          { id: "understand", label: "Understand", count: stats.understandCount },
          { id: "bookmarked", label: "Saved", icon: Bookmark },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 999,
                cursor: "pointer",
                ...M,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                background: isActive ? C.hero : "#fff",
                color: isActive ? C.heroFg : C.muted,
                border: `1.5px solid ${isActive ? C.hero : C.border}`,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = C.brand;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = C.border;
              }}
            >
              {tab.icon && <tab.icon style={{ width: 13 }} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: isActive ? `${C.highlight}33` : C.altBg,
                    color: isActive ? C.highlight : C.foreground,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── INSIGHTS LIST OR EMPTY STATE ── */}
      {isLoading ? (
        <div
          style={{
            background: "#fff",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "60px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: C.muted,
            fontSize: 14,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              border: `2px solid ${C.border}`,
              borderTopColor: C.brand,
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Evaluating deterministic financial metrics & generating recommendations...
        </div>
      ) : insights.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {insights.map((item) => {
            const cat = getCategoryConfig(item.category);
            const isWhyOpen = Boolean(expandedWhyIds[item._id]);
            const isPinned = Boolean(item.isPinned);
            const isBookmarked = Boolean(item.isBookmarked);
            const metrics = item.supportingMetrics || {};

            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${isPinned ? C.highlight : C.border}`,
                  borderRadius: 8,
                  padding: "20px 22px",
                  position: "relative",
                  boxShadow: isPinned ? `0 4px 18px ${C.highlight}22` : "none",
                }}
              >
                {/* Top Strip: Badges & Controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <cat.icon style={{ width: 12 }} />
                      {cat.label}
                    </span>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background:
                          item.priority === "high"
                            ? C.takeActionSoft
                            : item.priority === "medium"
                            ? C.saveSoft
                            : C.altBg,
                        color:
                          item.priority === "high"
                            ? C.takeAction
                            : item.priority === "medium"
                            ? C.save
                            : C.muted,
                        border: `1px solid ${C.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {item.priority} Priority
                    </span>

                    {item.relatedCategoryName && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.muted,
                          background: C.altBg,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        🏷️ {item.relatedCategoryName}
                      </span>
                    )}
                  </div>

                  {/* Actions (Pin, Bookmark, Dismiss) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => pinMutation.mutate(item._id)}
                      title={isPinned ? "Unpin" : "Pin to top"}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `1px solid ${isPinned ? C.highlight : C.border}`,
                        background: isPinned ? `${C.highlight}33` : C.altBg,
                        color: isPinned ? C.highlightFg : C.muted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.brandSoft)}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isPinned
                          ? `${C.highlight}33`
                          : C.altBg)
                      }
                    >
                      <Pin style={{ width: 13, transform: isPinned ? "rotate(45deg)" : "none" }} />
                    </button>

                    <button
                      onClick={() => bookmarkMutation.mutate(item._id)}
                      title={isBookmarked ? "Remove Bookmark" : "Save for later"}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `1px solid ${isBookmarked ? C.brand : C.border}`,
                        background: isBookmarked ? C.brandSoft : C.altBg,
                        color: isBookmarked ? C.brand : C.muted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.brandSoft)}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isBookmarked ? C.brandSoft : C.altBg)
                      }
                    >
                      <Bookmark
                        style={{
                          width: 13,
                          fill: isBookmarked ? C.brand : "none",
                        }}
                      />
                    </button>

                    <button
                      onClick={() => dismissMutation.mutate(item._id)}
                      title="Dismiss from feed"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `1px solid ${C.border}`,
                        background: C.altBg,
                        color: C.muted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.takeActionSoft;
                        e.currentTarget.style.color = C.takeAction;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = C.altBg;
                        e.currentTarget.style.color = C.muted;
                      }}
                    >
                      <X style={{ width: 14 }} />
                    </button>
                  </div>
                </div>

                {/* Title & Summary */}
                <h3
                  style={{
                    fontSize: "clamp(1.1rem,2vw,1.35rem)",
                    fontWeight: 900,
                    color: C.foreground,
                    margin: "0 0 6px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px", lineHeight: 1.5 }}>
                  {item.summary}
                </p>

                {/* Recommendation Box */}
                <div
                  style={{
                    background: C.altBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <Sparkles
                    style={{ width: 16, color: C.brand, flexShrink: 0, marginTop: 2 }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.brand,
                        display: "block",
                        marginBottom: 2,
                      }}
                    >
                      Personalized AI Recommendation
                    </span>
                    <p style={{ fontSize: 13, color: C.foreground, margin: 0, fontWeight: 600 }}>
                      {item.recommendation}
                    </p>
                  </div>
                </div>

                {/* Supporting Metrics Strip (Deterministic) */}
                {metrics && Object.keys(metrics).length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    {metrics.currentAmount !== undefined && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.foreground,
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        Current: <strong>{formatCurrency(metrics.currentAmount, cur)}</strong>
                      </span>
                    )}
                    {metrics.avgAmount !== undefined && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.muted,
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        3-Mo Avg: <strong>{formatCurrency(metrics.avgAmount, cur)}</strong>
                      </span>
                    )}
                    {metrics.percentageChange !== undefined && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: metrics.percentageChange > 0 ? C.takeAction : C.growth,
                          background:
                            metrics.percentageChange > 0 ? C.takeActionSoft : C.growthSoft,
                          border: `1px solid ${
                            metrics.percentageChange > 0 ? C.takeActionBorder : C.growBorder
                          }`,
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {metrics.percentageChange > 0 ? "+" : ""}
                        {metrics.percentageChange}% vs baseline
                      </span>
                    )}
                    {metrics.budgetLimit !== undefined && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.muted,
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        Monthly Cap: <strong>{formatCurrency(metrics.budgetLimit, cur)}</strong>
                      </span>
                    )}
                    {metrics.projectedMonthEnd !== undefined && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.brand,
                          background: C.brandSoft,
                          border: `1px solid ${C.border}`,
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        Forecast: <strong>{formatCurrency(metrics.projectedMonthEnd, cur)}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Interactive Savings Stepper if pattern is goal */}
                {item.pattern === "active_savings_goal" && metrics.targetAmount && (
                  <div
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      padding: "14px 16px",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.foreground }}>
                        Goal Target: {formatCurrency(metrics.targetAmount, cur)} · Remaining:{" "}
                        {formatCurrency(metrics.remainingAmount || 0, cur)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.growth }}>
                        {metrics.currentAmount
                          ? Math.round((metrics.currentAmount / metrics.targetAmount) * 100)
                          : 0}
                        % Completed
                      </span>
                    </div>

                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: C.altBg,
                        overflow: "hidden",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((metrics.currentAmount || 0) / (metrics.targetAmount || 1)) * 100
                            )
                          )}%`,
                          background: C.growth,
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    {/* Interactive Monthly Contribution Slider */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 12, color: C.muted }}>
                        Adjust Monthly Contribution:
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() =>
                            setGoalContributions((prev) => {
                              const curr =
                                prev[item._id] || metrics.suggestedMonthlyContribution || 100;
                              return { ...prev, [item._id]: Math.max(10, curr - 50) };
                            })
                          }
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: `1px solid ${C.border}`,
                            background: C.altBg,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.foreground }}>
                          {formatCurrency(
                            goalContributions[item._id] ||
                              metrics.suggestedMonthlyContribution ||
                              100,
                            cur
                          )}
                          /mo
                        </span>
                        <button
                          onClick={() =>
                            setGoalContributions((prev) => {
                              const curr =
                                prev[item._id] || metrics.suggestedMonthlyContribution || 100;
                              return { ...prev, [item._id]: curr + 50 };
                            })
                          }
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: `1px solid ${C.border}`,
                            background: C.altBg,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                          }}
                        >
                          +
                        </button>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: C.brand,
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: C.brandSoft,
                          }}
                        >
                          ≈{" "}
                          {Math.ceil(
                            (metrics.remainingAmount || 100) /
                              (goalContributions[item._id] ||
                                metrics.suggestedMonthlyContribution ||
                                100)
                          )}{" "}
                          months to complete
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* "Why am I getting this?" Expandable Accordion */}
                <div style={{ marginBottom: 14 }}>
                  <button
                    onClick={() => toggleWhy(item._id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.brand,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      ...M,
                    }}
                  >
                    <span>Why am I getting this?</span>
                    <ChevronDown
                      style={{
                        width: 14,
                        transform: isWhyOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {isWhyOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ overflow: "hidden", marginTop: 8 }}
                      >
                        <div
                          style={{
                            background: C.altBg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: "12px 16px",
                            fontSize: 12,
                            color: C.foreground,
                            lineHeight: 1.5,
                          }}
                        >
                          <p style={{ margin: "0 0 6px", fontWeight: 700, color: C.foreground }}>
                            {item.explanation}
                          </p>
                          <span style={{ fontSize: 11, color: C.muted }}>
                            Confidence: <strong>{item.confidence || "HIGH"}</strong> · Calculated
                            at {new Date(item.generatedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Working Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleAction(item)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 36,
                      padding: "0 18px",
                      borderRadius: 999,
                      background: C.highlight,
                      color: C.highlightFg,
                      border: "none",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      ...M,
                      boxShadow: `0 2px 10px ${C.highlight}44`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "oklch(0.82 0.18 157)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = C.highlight)}
                  >
                    <span>{item.actionLabel || "Take Action"}</span>
                    <ArrowUpRight style={{ width: 14 }} />
                  </button>

                  {item.pattern === "spending_spike" && metrics.drivers?.length > 0 && (
                    <button
                      onClick={() => setDriversModalItem(item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 36,
                        padding: "0 16px",
                        borderRadius: 999,
                        background: C.altBg,
                        border: `1.5px solid ${C.border}`,
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.foreground,
                        cursor: "pointer",
                        ...M,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.brandSoft)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = C.altBg)}
                    >
                      <span>View Spike Drivers ({metrics.drivers.length})</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            background: "#fff",
            border: `1.5px solid ${C.border}`,
            borderRadius: 8,
            padding: "60px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: C.growthSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 style={{ width: 24, color: C.growth }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: C.foreground,
                margin: "0 0 6px",
              }}
            >
              You're all caught up!
            </p>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, maxWidth: 420 }}>
              No critical spending anomalies or overspending risks were detected in this filter.
              Keep recording transactions to maintain accurate financial intelligence.
            </p>
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              height: 42,
              padding: "0 22px",
              borderRadius: 999,
              background: C.highlight,
              color: C.highlightFg,
              border: "none",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              ...M,
            }}
          >
            <RefreshCw style={{ width: 14 }} /> Refresh Analysis
          </button>
        </div>
      )}

      {/* ── MODAL: REVIEW & APPLY BUDGET REBALANCING ── */}
      <Portal>
        <AnimatePresence>
          {rebalanceModalItem && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(15,23,42,0.65)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                  ...M,
                  background: "#fff",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "24px 26px",
                  maxWidth: 520,
                  width: "100%",
                  boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Sliders style={{ width: 18, color: C.brand }} />
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: C.foreground, margin: 0 }}>
                      Review & Apply Suggested Budgets
                    </h3>
                  </div>
                  <button
                    onClick={() => setRebalanceModalItem(null)}
                    style={{
                      border: "none",
                      background: "none",
                      color: C.muted,
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
                  CampusCoin AI calculated these suggested monthly caps based on your past 3 months
                  of actual spending. No changes occur until you confirm.
                </p>

                <div
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    marginBottom: 20,
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: C.altBg, borderBottom: `1px solid ${C.border}` }}>
                        <th
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: 11,
                            fontWeight: 800,
                            color: C.muted,
                          }}
                        >
                          Category
                        </th>
                        <th
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontSize: 11,
                            fontWeight: 800,
                            color: C.muted,
                          }}
                        >
                          Current
                        </th>
                        <th
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontSize: 11,
                            fontWeight: 800,
                            color: C.brand,
                          }}
                        >
                          Suggested
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rebalanceModalItem.supportingMetrics?.suggestedBudgets?.map((b, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom:
                              idx !==
                              rebalanceModalItem.supportingMetrics.suggestedBudgets.length - 1
                                ? `1px solid ${C.border}`
                                : "none",
                          }}
                        >
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: C.foreground }}>
                            {b.categoryName}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", color: C.muted }}>
                            {formatCurrency(b.currentLimit, cur)}
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: C.growth,
                            }}
                          >
                            {formatCurrency(b.suggestedLimit, cur)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setRebalanceModalItem(null)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 999,
                      border: `1.5px solid ${C.border}`,
                      background: C.altBg,
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.muted,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyRebalance}
                    disabled={applyingBudgets}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 22px",
                      borderRadius: 999,
                      border: "none",
                      background: C.highlight,
                      color: C.highlightFg,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: applyingBudgets ? "not-allowed" : "pointer",
                      boxShadow: `0 4px 14px ${C.highlight}55`,
                    }}
                  >
                    {applyingBudgets ? "Applying..." : "Apply Verified Budgets"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ── MODAL: SPENDING DRIVERS INSPECTOR ── */}
      <Portal>
        <AnimatePresence>
          {driversModalItem && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(15,23,42,0.65)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                style={{
                  ...M,
                  background: "#fff",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "24px 26px",
                  maxWidth: 500,
                  width: "100%",
                  boxShadow: "0 20px 48px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ArrowLeftRight style={{ width: 18, color: C.takeAction }} />
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: C.foreground, margin: 0 }}>
                      Contributing Transactions
                    </h3>
                  </div>
                  <button
                    onClick={() => setDriversModalItem(null)}
                    style={{
                      border: "none",
                      background: "none",
                      color: C.muted,
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                </div>

                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>
                  The spike in <strong>{driversModalItem.relatedCategoryName || "spending"}</strong>{" "}
                  was primarily driven by these recent transactions:
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 20,
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {driversModalItem.supportingMetrics?.drivers?.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: C.altBg,
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.foreground,
                            display: "block",
                          }}
                        >
                          {d.description || "Expense"}
                        </span>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          {new Date(d.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: C.takeAction }}>
                        {formatCurrency(d.amount, cur)}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => {
                      setDriversModalItem(null);
                      handleAction(driversModalItem);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 20px",
                      borderRadius: 999,
                      border: "none",
                      background: C.highlight,
                      color: C.highlightFg,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Open in Ledger
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* ── AD BANNER ── */}
      <AdSenseAd slot="dashboard-bottom" />
    </div>
  );
}
