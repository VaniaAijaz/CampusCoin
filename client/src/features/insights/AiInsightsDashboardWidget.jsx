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
  Flame,
  Target,
  Info,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { getDashboardInsights, generateInsight } from "./insightsApi";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import toast from "react-hot-toast";

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

  // Category Semantic Colors
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
  const cur = user?.currency || "USD";

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
        navigate("/app/savings");
        break;

      case "review_subscriptions":
        navigate("/app/subscriptions");
        break;

      default:
        navigate("/app/insights");
        break;
    }
  };

  const toggleWhy = (id) => {
    setExpandedWhyId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="rounded-[3rem]"
      style={{
        ...M,
        background: "#fff",
        border: `1.5px solid ${C.border}`,
        borderRadius: "3rem",
        padding: "26px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* ── WIDGET HEADER ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: C.brand,
              }}
            >
              AI Copilot
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 999,
                background: C.brandSoft,
                color: C.brand,
              }}
            >
              Personalized
            </span>
          </div>
          <h3
            style={{
              fontSize: "clamp(1.2rem,2.5vw,1.5rem)",
              fontWeight: 900,
              color: C.foreground,
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Financial Insights & Recommendations
          </h3>
          <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0", fontWeight: 500 }}>
            Real-time pattern analysis from your verified transactions and monthly limits.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            title="Recalculate Insights"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              borderRadius: 999,
              background: C.altBg,
              border: `1.5px solid ${C.border}`,
              fontSize: 12,
              fontWeight: 700,
              color: C.foreground,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              opacity: isRefreshing ? 0.6 : 1,
              ...M,
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) e.currentTarget.style.background = C.brandSoft;
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) e.currentTarget.style.background = C.altBg;
            }}
          >
            <RefreshCw
              style={{
                width: 12,
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {isRefreshing ? "Analyzing..." : "Recalculate"}
          </button>

          <Link
            to="/app/insights"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 16px",
              borderRadius: 999,
              background: C.highlight,
              color: C.highlightFg,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              ...M,
              boxShadow: `0 2px 10px ${C.highlight}44`,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.82 0.18 157)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.highlight)}
          >
            <span>View All ({totalCount})</span>
            <ChevronRight style={{ width: 14 }} />
          </Link>
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      {isLoading ? (
        <div
          style={{
            padding: "40px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: C.muted,
            fontSize: 13,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              border: `2px solid ${C.border}`,
              borderTopColor: C.brand,
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Analyzing spending habits & evaluating budgets...
        </div>
      ) : insights.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {insights.slice(0, 3).map((item) => {
            const cat = getCategoryConfig(item.category);
            const isWhyOpen = expandedWhyId === item._id;
            const metrics = item.supportingMetrics || {};

            return (
              <div
                key={item._id}
                style={{
                  background: C.altBg,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "border-color 0.15s",
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <cat.icon style={{ width: 11 }} />
                      {cat.label}
                    </span>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 999,
                        background:
                          item.priority === "high"
                            ? C.takeActionSoft
                            : item.priority === "medium"
                            ? C.saveSoft
                            : "#fff",
                        color:
                          item.priority === "high"
                            ? C.takeAction
                            : item.priority === "medium"
                            ? C.save
                            : C.muted,
                        border: `1px solid ${C.border}`,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.priority}
                    </span>
                  </div>

                  {/* Title & Recommendation */}
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: C.foreground,
                      margin: "0 0 6px",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </h4>
                  <p
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      margin: "0 0 10px",
                      lineHeight: 1.45,
                      fontWeight: 500,
                    }}
                  >
                    {item.recommendation}
                  </p>

                  {/* Deterministic Metrics Strip */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    {metrics.currentAmount !== undefined && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.foreground,
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        Spent: {formatCurrency(metrics.currentAmount, cur)}
                      </span>
                    )}
                    {metrics.percentageChange !== undefined && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: metrics.percentageChange > 0 ? C.takeAction : C.growth,
                          background:
                            metrics.percentageChange > 0 ? C.takeActionSoft : C.growthSoft,
                          border: `1px solid ${
                            metrics.percentageChange > 0 ? C.takeActionBorder : C.growBorder
                          }`,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {metrics.percentageChange > 0 ? "+" : ""}
                        {metrics.percentageChange}%
                      </span>
                    )}
                    {metrics.budgetLimit !== undefined && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.muted,
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        Cap: {formatCurrency(metrics.budgetLimit, cur)}
                      </span>
                    )}
                  </div>

                  {/* "Why am I getting this?" Expandable */}
                  <div style={{ marginBottom: 10 }}>
                    <button
                      onClick={() => toggleWhy(item._id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.brand,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        ...M,
                      }}
                    >
                      <span>Why?</span>
                      <ChevronDown
                        style={{
                          width: 12,
                          transform: isWhyOpen ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                      />
                    </button>

                    {isWhyOpen && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: "8px 10px",
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          fontSize: 11,
                          color: C.foreground,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.explanation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Trigger */}
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => handleAction(item)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 999,
                      background: "#fff",
                      border: `1.5px solid ${C.border}`,
                      color: C.foreground,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      ...M,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.highlight;
                      e.currentTarget.style.borderColor = C.highlight;
                      e.currentTarget.style.color = C.highlightFg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.color = C.foreground;
                    }}
                  >
                    <span>{item.actionLabel || "Review"}</span>
                    <ArrowUpRight style={{ width: 13 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            padding: "24px 16px",
            background: C.altBg,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: C.growthSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.growth,
              flexShrink: 0,
            }}
          >
            <CheckCircle2 style={{ width: 18 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.foreground, margin: "0 0 2px" }}>
              Finances are currently balanced & healthy
            </p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
              No abnormal spikes or overspending detected across your active budget categories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
