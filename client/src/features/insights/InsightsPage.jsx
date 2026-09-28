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
  ArrowRight,
  TrendingUp,
  Target,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Shield,
  Wallet,
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
import "../dashboard/Dashboard.css";

/* ── CampusCoin Premium Design Tokens ── */
const C = {
  brand: "#2563eb",
  brandDeep: "#1d4ed8",
  brandSoft: "#eff6ff",
  brandBorder: "#dbeafe",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "rgba(172, 217, 251, 0.55)",
  cardBg: "rgba(255, 255, 255, 0.96)",
  altBg: "#f8fafc",

  takeAction: "#dc2626",
  takeActionSoft: "#fee2e2",
  takeActionBorder: "#fecdd3",

  save: "#d97706",
  saveSoft: "#fef3c7",
  saveBorder: "#fde68a",

  grow: "#16a34a",
  growSoft: "#dcfce7",
  growBorder: "#bbf7d0",

  understand: "#2563eb",
  understandSoft: "#eff6ff",
  understandBorder: "#bfdbfe",
};

const M = { fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" };

/** Clean up technical jargon into simple human student English */
function formatHumanText(text = "") {
  if (!text) return "";
  return text
    .replace(/Top spending drivers:/gi, "Largest purchases:")
    .replace(/Month-end spending forecast/gi, "Monthly Spend Forecast")
    .replace(/projected to exceed your total budget cap by ~?/gi, "which is over your budget limit by ")
    .replace(/projected to spend/gi, "on track to spend")
    .replace(/At your current rate/gi, "At your current pace")
    .replace(/Personalized AI Recommendation/gi, "Smart Action Tip")
    .replace(/discretionary purchases/gi, "extra purchases")
    .replace(/deterministic/gi, "real");
}

export default function InsightsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [expandedWhyIds, setExpandedWhyIds] = useState({});
  const [driversModalItem, setDriversModalItem] = useState(null);

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
      toast.success("AI tips refreshed with your latest transactions!");
    },
    onError: () => {
      toast.error("Could not refresh tips right now.");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissInsight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInsights"] });
      toast.success("Tip dismissed from active feed.");
    },
    onError: () => {
      toast.error("Could not dismiss tip.");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmarkInsight,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      toast.success(res.isBookmarked ? "Tip saved to bookmarks!" : "Bookmark removed.");
    },
  });

  const pinMutation = useMutation({
    mutationFn: togglePinInsight,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["insightsList"] });
      toast.success(res.isPinned ? "Tip pinned to top!" : "Tip unpinned.");
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
      if (item.priority === "high" || item.priority === "critical") highPriorityCount++;
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
          ? `${highPriorityCount} Alert${highPriorityCount > 1 ? "s" : ""}`
          : takeActionCount > 0
          ? "Action Needed"
          : "On Track",
    };
  }, [insights]);

  const toggleWhy = (id) => {
    setExpandedWhyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryConfig = (cat) => {
    switch (cat) {
      case "take_action":
        return {
          label: "Action Needed",
          color: C.takeAction,
          bg: C.takeActionSoft,
          border: C.takeActionBorder,
          icon: AlertTriangle,
        };
      case "save":
        return {
          label: "Saving Tip",
          color: C.save,
          bg: C.saveSoft,
          border: C.saveBorder,
          icon: Lightbulb,
        };
      case "grow":
        return {
          label: "Money Goal",
          color: C.grow,
          bg: C.growSoft,
          border: C.growBorder,
          icon: Target,
        };
      case "understand":
      default:
        return {
          label: "Spending Info",
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
        if (actionPayload?.categoryId) {
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
        navigate("/app/budget");
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

  return (
    <div style={{ ...M, display: "flex", flexDirection: "column", gap: 24, maxWidth: 960, margin: "0 auto", width: "100%" }}>
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#2563eb", letterSpacing: "0.02em" }}>
              Smart Student Assistant
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.7rem, 3.5vw, 2.2rem)",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            Smart Money Tips
          </h1>
          <p style={{ fontSize: 14, color: "#475569", margin: "6px 0 0", fontWeight: 500 }}>
            Simple, practical tips based on your real expenses to help you save more.
          </p>
        </div>

        <button
          onClick={() => refreshMutation.mutate()}
          disabled={isRefreshing}
          className="dash-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 700,
            cursor: isRefreshing ? "not-allowed" : "pointer",
            opacity: isRefreshing ? 0.75 : 1,
          }}
        >
          <RefreshCw
            style={{
              width: 16,
              height: 16,
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {isRefreshing ? "Checking Expenses..." : "Refresh Tips"}
        </button>
      </div>

      {/* ── QUICK METRICS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "Total Tips",
            value: stats.total,
            color: "#2563eb",
            bg: "#eff6ff",
            border: "#dbeafe",
            icon: Lightbulb,
          },
          {
            label: "Budget Alerts",
            value: stats.takeActionCount,
            color: stats.takeActionCount > 0 ? "#dc2626" : "#475569",
            bg: stats.takeActionCount > 0 ? "#fee2e2" : "#f8fafc",
            border: stats.takeActionCount > 0 ? "#fecdd3" : "#e2e8f0",
            icon: AlertTriangle,
          },
          {
            label: "Saving Ideas",
            value: stats.saveCount + stats.growCount,
            color: "#16a34a",
            bg: "#dcfce7",
            border: "#bbf7d0",
            icon: Target,
          },
          {
            label: "Status",
            value: stats.healthLabel,
            color: stats.highPriorityCount > 0 ? "#dc2626" : "#16a34a",
            bg: stats.highPriorityCount > 0 ? "#fee2e2" : "#dcfce7",
            border: stats.highPriorityCount > 0 ? "#fecdd3" : "#bbf7d0",
            icon: Shield,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="dash-kpi-card"
            style={{
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: k.bg,
                border: `1px solid ${k.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: k.color,
                flexShrink: 0,
              }}
            >
              <k.icon style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {k.label}
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: k.color, margin: "2px 0 0", lineHeight: 1.2 }}>
                {k.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All Tips", count: stats.total },
          { id: "take_action", label: "Alerts", count: stats.takeActionCount },
          { id: "save", label: "Saving Ideas", count: stats.saveCount },
          { id: "grow", label: "Goals", count: stats.growCount },
          { id: "understand", label: "Spending Info", count: stats.understandCount },
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
                padding: "8px 16px",
                borderRadius: 9999,
                cursor: "pointer",
                ...M,
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                background: isActive ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "rgba(255, 255, 255, 0.92)",
                color: isActive ? "#ffffff" : "#475569",
                border: `1px solid ${isActive ? "transparent" : "rgba(172, 217, 251, 0.55)"}`,
                boxShadow: isActive ? "0 4px 12px rgba(37, 99, 235, 0.28)" : "0 1px 3px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(224, 242, 254, 0.65)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.92)";
              }}
            >
              {tab.icon && <tab.icon style={{ width: 13, height: 13 }} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "1px 7px",
                    borderRadius: 9999,
                    background: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(224, 242, 254, 0.8)",
                    color: isActive ? "#ffffff" : "#2563eb",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── INSIGHTS FEED ── */}
      {isLoading ? (
        <div
          className="dash-card"
          style={{
            padding: "50px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "#64748b",
            fontSize: 14,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              border: "2px solid #e2e8f0",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Checking your transactions to prepare easy tips...
        </div>
      ) : insights.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="dash-card"
                style={{
                  padding: "24px 26px",
                  position: "relative",
                  border: isPinned ? "1.5px solid #2563eb" : "1px solid rgba(172, 217, 251, 0.55)",
                  boxShadow: isPinned ? "0 6px 20px rgba(37, 99, 235, 0.12)" : "0 4px 16px rgba(37, 99, 235, 0.04)",
                }}
              >
                {/* Top Row: Category Tag & Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 9999,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                      }}
                    >
                      <cat.icon style={{ width: 13, height: 13 }} />
                      {cat.label}
                    </span>

                    {item.priority === "high" || item.priority === "critical" ? (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 9999,
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fecdd3",
                        }}
                      >
                        ⚡ High Alert
                      </span>
                    ) : null}

                    {item.relatedCategoryName && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#334155",
                          background: "#eff6ff",
                          border: "1px solid #dbeafe",
                          padding: "3px 10px",
                          borderRadius: 9999,
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
                      title={isPinned ? "Unpin tip" : "Pin tip to top"}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: `1px solid ${isPinned ? "#2563eb" : "#e2e8f0"}`,
                        background: isPinned ? "#eff6ff" : "#fff",
                        color: isPinned ? "#2563eb" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Pin style={{ width: 14, height: 14, transform: isPinned ? "rotate(45deg)" : "none" }} />
                    </button>

                    <button
                      onClick={() => bookmarkMutation.mutate(item._id)}
                      title={isBookmarked ? "Remove bookmark" : "Save tip for later"}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: `1px solid ${isBookmarked ? "#2563eb" : "#e2e8f0"}`,
                        background: isBookmarked ? "#eff6ff" : "#fff",
                        color: isBookmarked ? "#2563eb" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Bookmark
                        style={{
                          width: 14,
                          height: 14,
                          fill: isBookmarked ? "#2563eb" : "none",
                        }}
                      />
                    </button>

                    <button
                      onClick={() => dismissMutation.mutate(item._id)}
                      title="Dismiss tip"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#fee2e2";
                        e.currentTarget.style.color = "#dc2626";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#64748b";
                      }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 8px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatHumanText(item.title)}
                </h3>

                {/* Readable Human Explanation */}
                <p style={{ fontSize: 14.5, color: "#334155", margin: "0 0 16px", lineHeight: 1.6, fontWeight: 500 }}>
                  {formatHumanText(item.summary)}
                </p>

                {/* Quick Tip Box */}
                {item.recommendation && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(219, 234, 254, 0.6) 100%)",
                      border: "1px solid rgba(191, 219, 254, 0.8)",
                      borderRadius: 12,
                      padding: "14px 18px",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "#2563eb",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Lightbulb style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#1d4ed8",
                          display: "block",
                          marginBottom: 3,
                        }}
                      >
                        Quick Action Tip
                      </span>
                      <p style={{ fontSize: 14, color: "#0f172a", margin: 0, fontWeight: 700, lineHeight: 1.5 }}>
                        {formatHumanText(item.recommendation)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stat Chips */}
                {metrics && Object.keys(metrics).length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    {metrics.currentAmount !== undefined && (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#0f172a",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "5px 12px",
                          borderRadius: 9999,
                        }}
                      >
                        Current Spend: <strong style={{ color: "#2563eb" }}>{formatCurrency(metrics.currentAmount, cur)}</strong>
                      </span>
                    )}
                    {metrics.projectedMonthEnd !== undefined && (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#1d4ed8",
                          background: "#eff6ff",
                          border: "1px solid #dbeafe",
                          padding: "5px 12px",
                          borderRadius: 9999,
                        }}
                      >
                        Forecast: <strong>{formatCurrency(metrics.projectedMonthEnd, cur)}</strong>
                      </span>
                    )}
                    {metrics.budgetLimit !== undefined && (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#475569",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "5px 12px",
                          borderRadius: 9999,
                        }}
                      >
                        Limit: <strong>{formatCurrency(metrics.budgetLimit, cur)}</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Single Clear Action Button in Sapphire Blue */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
                  <button
                    onClick={() => handleAction(item)}
                    className="dash-btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      height: 40,
                      padding: "0 20px",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <span>{item.actionLabel || "Review Expenses"}</span>
                    <ArrowRight style={{ width: 15, height: 15 }} />
                  </button>

                  {item.pattern === "spending_spike" && metrics.drivers?.length > 0 && (
                    <button
                      onClick={() => setDriversModalItem(item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 40,
                        padding: "0 18px",
                        borderRadius: 9999,
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#334155",
                        cursor: "pointer",
                        ...M,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#eff6ff";
                        e.currentTarget.style.borderColor = "#93c5fd";
                        e.currentTarget.style.color = "#2563eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.color = "#334155";
                      }}
                    >
                      <span>Highest Purchases ({metrics.drivers.length})</span>
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
          className="dash-card"
          style={{
            padding: "50px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
              marginBottom: 12,
            }}
          >
            <CheckCircle2 style={{ width: 24, height: 24 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            You're All Caught Up!
          </h3>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 16px", maxWidth: 420 }}>
            Your spending is looking good and no urgent budget alerts were found.
          </p>
          <button
            onClick={() => refreshMutation.mutate()}
            className="dash-btn-primary"
            style={{ padding: "10px 22px", fontSize: 13.5 }}
          >
            Check Spending Again
          </button>
        </div>
      )}

      {/* ── DRIVERS BREAKDOWN MODAL ── */}
      {driversModalItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setDriversModalItem(null)}
        >
          <div
            className="dash-card"
            style={{
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                Top Spending Purchases
              </h3>
              <button
                onClick={() => setDriversModalItem(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {driversModalItem.supportingMetrics?.drivers?.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{d.categoryName}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>
                    {formatCurrency(d.amount, cur)}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setDriversModalItem(null);
                navigate("/app/transactions");
              }}
              className="dash-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              View Full Transaction History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
