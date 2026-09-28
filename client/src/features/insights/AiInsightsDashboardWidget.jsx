import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  AlertTriangle,
  Flame,
  Target,
  Info,
  CheckCircle2,
} from "lucide-react";
import { getDashboardInsights, generateInsight } from "./insightsApi";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import toast from "react-hot-toast";

const C = {
  brand: "#2563eb",
  brandSoft: "#eff6ff",
  brandBorder: "#dbeafe",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
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
  understandBorder: "#dbeafe",
};

const M = { fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" };

export default function AiInsightsDashboardWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      toast.success("AI tips refreshed!");
    },
    onError: () => {
      toast.error("Couldn't refresh tips.");
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
          label: "Action Needed",
          color: C.takeAction,
          bg: C.takeActionSoft,
          border: C.takeActionBorder,
          icon: AlertTriangle,
        };
      case "save":
        return {
          label: "Savings Tip",
          color: C.save,
          bg: C.saveSoft,
          border: C.saveBorder,
          icon: Flame,
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

  return (
    <div
      style={{
        ...M,
        background: "#ffffff",
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "20px 22px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02)",
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
                letterSpacing: "0.08em",
                color: C.brand,
              }}
            >
              Smart Money Tips
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 9999,
                background: C.brandSoft,
                color: C.brand,
                border: `1px solid ${C.brandBorder}`,
              }}
            >
              For You
            </span>
          </div>
          <h3
            style={{
              fontSize: "17px",
              fontWeight: 800,
              color: C.foreground,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Insights & Suggestions
          </h3>
          <p style={{ fontSize: 13, color: C.muted, margin: "3px 0 0", fontWeight: 500 }}>
            Simple recommendations to help you save and keep your spending on budget.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={isRefreshing}
            title="Refresh Tips"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 9999,
              background: "#ffffff",
              border: `1px solid ${C.border}`,
              fontSize: 12.5,
              fontWeight: 600,
              color: C.foreground,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              opacity: isRefreshing ? 0.6 : 1,
              ...M,
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) e.currentTarget.style.background = C.altBg;
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) e.currentTarget.style.background = "#ffffff";
            }}
          >
            <RefreshCw
              style={{
                width: 13,
                height: 13,
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            {isRefreshing ? "Analyzing..." : "Refresh"}
          </button>

          <Link
            to="/app/insights"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 16px",
              borderRadius: 9999,
              background: C.brand,
              color: "#ffffff",
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: "none",
              ...M,
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
              transition: "all 0.15s ease",
            }}
          >
            <span>View All ({totalCount})</span>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      {isLoading ? (
        <div
          style={{
            padding: "32px 0",
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
              width: 18,
              height: 18,
              border: `2px solid ${C.border}`,
              borderTopColor: C.brand,
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Checking your latest campus spending...
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

            return (
              <div
                key={item._id}
                style={{
                  background: C.altBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                }}
              >
                <div>
                  {/* Top Badge */}
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
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 9999,
                        background: cat.bg,
                        color: cat.color,
                        border: `1px solid ${cat.border}`,
                      }}
                    >
                      <cat.icon style={{ width: 12, height: 12 }} />
                      {cat.label}
                    </span>
                  </div>

                  {/* Title & Recommendation */}
                  <h4
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: C.foreground,
                      margin: "0 0 6px",
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </h4>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: C.muted,
                      margin: "0 0 14px",
                      lineHeight: 1.45,
                      fontWeight: 500,
                    }}
                  >
                    {item.recommendation}
                  </p>
                </div>

                {/* Clean Action Button */}
                <button
                  type="button"
                  onClick={() => handleAction(item)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    height: 36,
                    borderRadius: 9999,
                    background: "#ffffff",
                    border: `1px solid ${C.border}`,
                    color: C.foreground,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    ...M,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.brandSoft;
                    e.currentTarget.style.color = C.brand;
                    e.currentTarget.style.borderColor = C.brandBorder;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = C.foreground;
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <span>{item.actionLabel || "Review"}</span>
                  <ArrowUpRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 13 }}>
          <CheckCircle2 style={{ width: 28, height: 28, color: C.grow, margin: "0 auto 8px" }} />
          <p style={{ fontWeight: 700, color: C.foreground, margin: "0 0 2px" }}>Everything is on track!</p>
          <p style={{ margin: 0 }}>Add more expenses to see personalized suggestions.</p>
        </div>
      )}
    </div>
  );
}
