import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useOutletContext, Navigate } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  FileText,
  PieChart as PieIcon,
  Plus,
  TrendingUp,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Tag,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getDashboardMetrics, getRecentTransactions } from "../transactions/transactionApi";
import { getBudgets } from "../budgets/budgetApi";
import { getSubscriptions } from "../subscriptions/subscriptionApi";
import { getCategories } from "../categories/categoryApi";
import TransactionModal from "../transactions/TransactionModal";
import TransactionDetailModal from "../../components/ui/TransactionDetailModal";
import CategoryIcon from "../../components/ui/CategoryIcon";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import NumberTicker from "../../components/ui/NumberTicker";
import { formatCurrency } from "../../utils/currencyUtils";
import AdSenseAd from "../../components/ads/AdSenseAd";
import AiInsightsDashboardWidget from "../insights/AiInsightsDashboardWidget";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
};
const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };

const CATEGORY_CHART_COLORS = [
  "oklch(0.59 0.22 262)", // brand blue
  "oklch(0.64 0.17 157)", // growth green
  "oklch(0.88 0.18 157)", // highlight lime
  "oklch(0.61 0.23 290)", // purple
  "oklch(0.73 0.18 252)", // sky
  "oklch(0.83 0.17 70)",  // amber
  "oklch(0.59 0.18 230)", // teal
  "oklch(0.65 0.24 16)",  // rose
  "oklch(0.5 0.025 255)", // slate
];

const ChartTooltip = ({ active, payload, label, cur }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        ...M,
        background: "#fff",
        border: `1.5px solid ${C.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        fontSize: 12,
      }}
    >
      <p
        style={{
          fontWeight: 700,
          color: C.muted,
          marginBottom: 8,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: C.foreground, fontWeight: 800 }}>{formatCurrency(p.value, cur)}</span>
        </div>
      ))}
    </div>
  );
};

const CategoryPieTooltip = ({ active, payload, cur }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div
      style={{
        ...M,
        background: "#fff",
        border: `1.5px solid ${C.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: data.payload.fill || data.color || C.brand,
          }}
        />
        <span style={{ fontWeight: 800, color: C.foreground }}>{data.name}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <span style={{ color: C.muted, fontSize: 11 }}>Amount Spent:</span>
        <span style={{ fontWeight: 900, color: C.foreground }}>{formatCurrency(data.value, cur)}</span>
      </div>
      {data.payload.count !== undefined && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginTop: 2 }}>
          <span style={{ color: C.muted, fontSize: 11 }}>Transactions:</span>
          <span style={{ fontWeight: 700, color: C.brand }}>{data.payload.count}</span>
        </div>
      )}
    </div>
  );
};

const defaultDashboard = {
  metrics: {
    currentMonth: { income: 0, expense: 0, netSavings: 0 },
    trends: [
      { month: "May", income: 0, expense: 0 },
      { month: "Jun", income: 0, expense: 0 },
      { month: "Jul", income: 0, expense: 0 },
      { month: "Aug", income: 0, expense: 0 },
      { month: "Sep", income: 0, expense: 0 },
      { month: "Oct", income: 0, expense: 0 },
    ],
    categoryBreakdown: [],
  },
  recentTx: [],
  budgets: [],
  subscriptions: [],
  categories: [],
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const outletCtx = useOutletContext();
  const queryClient = useQueryClient();
  const ref = useRef(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const openAdd = outletCtx?.openQuickAdd || (() => setQuickAddOpen(true));

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      try {
        const [metricsRes, recentRes, budgetsRes, subsRes, catsRes] = await Promise.allSettled([
          getDashboardMetrics(),
          getRecentTransactions(),
          getBudgets(),
          getSubscriptions(),
          getCategories("expense"),
        ]);
        return {
          metrics:
            metricsRes.status === "fulfilled" && metricsRes.value?.success
              ? metricsRes.value
              : defaultDashboard.metrics,
          recentTx:
            recentRes.status === "fulfilled" && recentRes.value?.success
              ? recentRes.value.transactions || []
              : [],
          budgets:
            budgetsRes.status === "fulfilled" && budgetsRes.value?.success
              ? budgetsRes.value.budgets || []
              : [],
          subscriptions:
            subsRes.status === "fulfilled" && subsRes.value?.success
              ? subsRes.value.subscriptions || []
              : [],
          categories:
            catsRes.status === "fulfilled" && catsRes.value?.success
              ? catsRes.value.categories || []
              : [],
        };
      } catch {
        return defaultDashboard;
      }
    },
    initialData: defaultDashboard,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(isAuthenticated),
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".di",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out", clearProps: "transform,opacity" }
        );
      }, ref);
      return () => ctx.revert();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!isAuthenticated && !isAuthLoading) return <Navigate to="/login" replace />;
  if (isAuthLoading) return <DashboardSkeleton />;
  if (queryLoading && !data) return <DashboardSkeleton />;

  const { metrics, recentTx, budgets, categories } = data || defaultDashboard;
  const income = metrics?.currentMonth?.income || 0;
  const expense = metrics?.currentMonth?.expense || 0;
  const balance = income - expense;
  const avail = (budgets || []).reduce((a, b) => a + (b.limitAmount - (b.spentAmount || 0)), 0) || 0;
  const cur = user?.currency || "USD";
  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const chartData = useMemo(() => {
    const raw = metrics?.trends || [];
    if (!raw.length) return defaultDashboard.metrics.trends;
    return raw.map((d) => ({ month: d.month || "", income: Number(d.income) || 0, expense: Number(d.expense) || 0 }));
  }, [metrics?.trends]);

  // Merge Category Tab definitions with actual monthly spending
  const categoriesList = useMemo(() => {
    const breakdown = metrics?.categoryBreakdown || [];
    const breakdownMap = {};

    breakdown.forEach((b) => {
      if (b._id) breakdownMap[b._id.toString()] = b;
      if (b.name) breakdownMap[b.name.toLowerCase().trim()] = b;
    });

    // If categories exist in categories tab, map every category with its spent amount:
    if (categories && categories.length > 0) {
      return categories
        .filter((c) => c.type === "expense" || !c.type)
        .map((cat) => {
          const idKey = cat._id?.toString();
          const nameKey = cat.name?.toLowerCase().trim();
          const matched = (idKey && breakdownMap[idKey]) || (nameKey && breakdownMap[nameKey]);

          return {
            _id: cat._id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            total: matched ? Number(matched.total) || 0 : 0,
            count: matched ? Number(matched.count) || 0 : 0,
          };
        })
        .sort((a, b) => b.total - a.total);
    }

    // Fallback to breakdown directly if categories tab list is empty
    return breakdown;
  }, [metrics?.categoryBreakdown, categories]);

  const totalCategorizedExpense = useMemo(() => {
    return categoriesList.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
  }, [categoriesList]);

  const activeCategoriesWithSpending = useMemo(() => {
    return categoriesList.filter((c) => Number(c.total) > 0);
  }, [categoriesList]);

  const topCategory = useMemo(() => {
    return activeCategoriesWithSpending.length > 0 ? activeCategoriesWithSpending[0] : null;
  }, [activeCategoriesWithSpending]);

  const pieData = useMemo(() => {
    const active = activeCategoriesWithSpending;
    if (active.length === 0) return [];
    return active.map((cat, i) => ({
      ...cat,
      name: cat.name || "Category",
      value: Number(cat.total) || 0,
      fill: cat.color || CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
    }));
  }, [activeCategoriesWithSpending]);

  const displayTx = useMemo(() => (recentTx || []).slice(0, 6), [recentTx]);

  return (
    <div ref={ref} style={{ ...M, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. HERO */}
      <div
        className="di"
        style={{
          background: C.hero,
          borderRadius: 8,
          padding: "clamp(2rem,4vw,2.8rem)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.16,
            backgroundImage: `linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
            backgroundSize: "72px 72px",
            WebkitMaskImage: "linear-gradient(to bottom,black,transparent 90%)",
            maskImage: "linear-gradient(to bottom,black,transparent 90%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            right: -120,
            top: -120,
            border: `1px solid ${C.heroLine}`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 250,
            height: 250,
            right: -60,
            top: -60,
            border: `1px solid ${C.brand}50`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${C.heroLine}`,
              fontSize: 12,
              fontWeight: 600,
              color: C.heroMuted,
              marginBottom: 24,
            }}
          >
            <Sparkles style={{ width: 14, color: C.highlight }} /> {month} · Net Balance
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 32,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "clamp(3rem,7vw,5rem)",
                  fontWeight: 900,
                  color: C.heroFg,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.9,
                  marginBottom: 20,
                }}
              >
                <NumberTicker value={balance} currencyCode={cur} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: `${C.highlight}20`,
                    border: `1px solid ${C.heroLine}`,
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.highlight,
                  }}
                >
                  {balance >= 0 ? (
                    <>
                      <ArrowUpRight style={{ width: 13 }} /> Positive cash flow
                    </>
                  ) : (
                    <>
                      <ArrowDownRight style={{ width: 13 }} /> Negative cash flow
                    </>
                  )}
                </span>
                <button
                  onClick={openAdd}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    height: 44,
                    padding: "0 24px",
                    borderRadius: 999,
                    background: C.highlight,
                    color: C.highlightFg,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    ...M,
                    boxShadow: `0 4px 20px ${C.highlight}55`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.82 0.18 157)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = C.highlight)}
                >
                  <Plus style={{ width: 16 }} /> Add Transaction
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Income", value: income, accent: C.highlight, icon: <ArrowUpRight style={{ width: 14 }} /> },
                { label: "Expense", value: expense, accent: C.growth, icon: <ArrowDownRight style={{ width: 14 }} /> },
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${C.heroLine}`,
                    borderRadius: 8,
                    padding: "18px 22px",
                    minWidth: 140,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ color: t.accent }}>{t.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: C.heroMuted,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {t.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.heroFg, letterSpacing: "-0.03em" }}>
                    <NumberTicker value={t.value} currencyCode={cur} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI STRIP — 4 columns horizontal */}
      <div
        className="di"
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
            label: "Total Income",
            value: income,
            accent: C.growth,
            soft: C.growthSoft,
            icon: <ArrowUpRight style={{ width: 20 }} />,
            tag: "This month",
          },
          {
            label: "Total Expenses",
            value: expense,
            accent: C.brand,
            soft: C.brandSoft,
            icon: <ArrowDownRight style={{ width: 20 }} />,
            tag: "This month",
          },
          {
            label: "Budget Remaining",
            value: avail,
            accent: C.growth,
            soft: C.growthSoft,
            icon: <Target style={{ width: 20 }} />,
            tag: `${budgets?.length || 0} active`,
          },
          {
            label: "Transactions",
            value: recentTx?.length || 0,
            accent: C.brand,
            soft: C.brandSoft,
            icon: <FileText style={{ width: 20 }} />,
            tag: "Logged",
            raw: true,
          },
        ].map((card) => (
          <div key={card.label} style={{ background: "#fff", padding: "24px 20px" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: card.soft,
                color: card.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {card.icon}
            </div>
            <div
              style={{
                fontSize: "clamp(1.8rem,3vw,2.4rem)",
                fontWeight: 900,
                color: C.foreground,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {card.raw ? card.value : <NumberTicker value={card.value} currencyCode={cur} />}
            </div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 8px",
              }}
            >
              {card.label}
            </p>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 600,
                color: card.accent,
                background: card.soft,
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              {card.tag}
            </span>
          </div>
        ))}
      </div>

      {/* 3. AI FINANCIAL INSIGHTS COPILOT WIDGET */}
      <div className="di">
        <AiInsightsDashboardWidget />
      </div>

      {/* 4. CATEGORY SPENDING OVERVIEW SECTION (All Categories with Spent Amounts) */}
      <div className="di" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
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
                margin: "0 0 4px",
              }}
            >
              Expense Breakdown
            </p>
            <h2
              style={{
                fontSize: "clamp(1.3rem,2.5vw,1.7rem)",
                fontWeight: 900,
                color: C.foreground,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Student Spending by Category
            </h2>
            <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0", fontWeight: 500 }}>
              All your configured expense categories and how much has been spent this month.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {topCategory && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: C.brandSoft,
                  color: C.brand,
                  border: `1px solid ${C.border}`,
                }}
              >
                🔥 Top Spend: <strong>{topCategory.name}</strong> ({formatCurrency(topCategory.total, cur)})
              </span>
            )}
            <Link
              to="/app/categories"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 700,
                color: C.brand,
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 999,
                background: C.altBg,
                border: `1px solid ${C.border}`,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.brand;
                e.currentTarget.style.background = C.brandSoft;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = C.altBg;
              }}
            >
              <span>Categories Tab</span>
              <ChevronRight style={{ width: 14 }} />
            </Link>
          </div>
        </div>

        {/* Donut Chart + Category Portfolio Bento Grid */}
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: activeCategoriesWithSpending.length > 0 ? "340px 1fr" : "1fr",
          }}
        >
          {/* Donut Distribution Chart (when there are active expenses) */}
          {activeCategoriesWithSpending.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: C.muted,
                    }}
                  >
                    Active Share
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.brand,
                      background: C.brandSoft,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {activeCategoriesWithSpending.length} Active
                  </span>
                </div>

                <div style={{ height: 190, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CategoryPieTooltip cur={cur} />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text inside Donut */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>
                      Total Spent
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: C.foreground }}>
                      {formatCurrency(totalCategorizedExpense, cur)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 10px",
                  paddingTop: 12,
                  borderTop: `1px solid ${C.border}`,
                  marginTop: 6,
                }}
              >
                {activeCategoriesWithSpending.slice(0, 4).map((cat, i) => {
                  const pct =
                    totalCategorizedExpense > 0
                      ? Math.round(((Number(cat.total) || 0) / totalCategorizedExpense) * 100)
                      : 0;
                  return (
                    <div key={cat._id || i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: cat.color || CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
                          flexShrink: 0,
                          display: "block",
                        }}
                      />
                      <span
                        style={{
                          color: C.muted,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {cat.name}
                      </span>
                      <span style={{ fontWeight: 800, color: C.foreground, flexShrink: 0 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Category Portfolio Cards (Shows every category with its spent amount) */}
          <div
            style={{
              background: "#fff",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 10,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.foreground, margin: 0 }}>
                Categories & Monthly Spending
              </h3>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                {categoriesList.length} configured · Total: <strong>{formatCurrency(totalCategorizedExpense, cur)}</strong>
              </span>
            </div>

            {categoriesList.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 10,
                  maxHeight: 320,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {categoriesList.map((cat, i) => {
                  const spent = Number(cat.total) || 0;
                  const pct = totalCategorizedExpense > 0 ? Math.round((spent / totalCategorizedExpense) * 100) : 0;
                  const catColor = cat.color || CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length];
                  const hasSpent = spent > 0;

                  return (
                    <Link
                      key={cat._id || i}
                      to={`/app/transactions?categoryId=${cat._id}&category=${encodeURIComponent(cat.name || "")}`}
                      title={`Click to view ${cat.name} transactions`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: hasSpent ? C.altBg : "#fafafa",
                        border: `1px solid ${hasSpent ? C.border : "oklch(0.93 0.008 255)"}`,
                        textDecoration: "none",
                        transition: "all 0.15s",
                        opacity: hasSpent ? 1 : 0.82,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.brand;
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = hasSpent ? C.border : "oklch(0.93 0.008 255)";
                        e.currentTarget.style.background = hasSpent ? C.altBg : "#fafafa";
                        e.currentTarget.style.opacity = hasSpent ? "1" : "0.82";
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
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${catColor}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CategoryIcon categoryName={cat.name} className="w-4 h-4" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: C.foreground,
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cat.name}
                            </p>
                            <span style={{ fontSize: 10, color: C.muted }}>
                              {hasSpent ? `${cat.count} txs · ${pct}% of total` : "0 transactions"}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: hasSpent ? C.foreground : C.muted,
                            letterSpacing: "-0.02em",
                            flexShrink: 0,
                          }}
                        >
                          {formatCurrency(spent, cur)}
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div
                        style={{
                          height: 4,
                          background: `${C.border}`,
                          borderRadius: 99,
                          overflow: "hidden",
                          marginTop: 4,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, pct)}%`,
                            background: hasSpent ? catColor : "transparent",
                            borderRadius: 99,
                            transition: "width 0.4s",
                          }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: "36px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: C.altBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.muted,
                  }}
                >
                  <Tag style={{ width: 18 }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.foreground, margin: 0 }}>
                  No categories found
                </p>
                <p style={{ fontSize: 12, color: C.muted, margin: 0, textAlign: "center", maxWidth: 360 }}>
                  View your Category Tab to customize your spending categories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. BENTO: Chart + Transactions */}
      <div className="di" style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 340px" }}>
        {/* Chart */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "clamp(1.4rem,3vw,2rem)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: C.brand,
              margin: "0 0 8px",
            }}
          >
            6-month overview
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 20,
              borderBottom: `1px solid ${C.border}`,
              paddingBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(1.3rem,2.5vw,1.7rem)",
                fontWeight: 900,
                color: C.foreground,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Income vs. Expenses
            </h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.muted,
                background: C.altBg,
                border: `1px solid ${C.border}`,
                borderRadius: 999,
                padding: "5px 12px",
              }}
            >
              Past 6 Months
            </span>
          </div>
          <div style={{ flex: 1, minHeight: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.growth} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={C.growth} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.brand} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={C.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="month" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={C.muted}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, cur)}
                />
                <Tooltip content={<ChartTooltip cur={cur} />} cursor={{ stroke: `${C.brand}30`, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke={C.growth}
                  strokeWidth={2.5}
                  fill="url(#gi)"
                  dot={{ r: 3.5, fill: C.growth, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke={C.brand}
                  strokeWidth={2.5}
                  fill="url(#ge)"
                  dot={{ r: 3.5, fill: C.brand, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              paddingTop: 12,
              borderTop: `1px solid ${C.border}`,
              marginTop: 8,
            }}
          >
            {[
              { l: "Income", c: C.growth },
              { l: "Expense", c: C.brand },
            ].map((x) => (
              <div
                key={x.l}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted, fontWeight: 600 }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: x.c, display: "block" }} />
                {x.l}
              </div>
            ))}
          </div>
        </div>

        {/* Transactions — brand blue */}
        <div
          style={{
            background: C.brand,
            borderRadius: 8,
            padding: "clamp(1.4rem,3vw,2rem)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.1,
              backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.6)",
                margin: "0 0 8px",
              }}
            >
              Activity
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.heroFg,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Recent Transactions
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.15)",
                  color: C.heroFg,
                }}
              >
                {recentTx?.length || 0}
              </span>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            {displayTx.length > 0 ? (
              displayTx.map((tx) => (
                <div
                  key={tx._id}
                  onClick={() => setSelectedTx(tx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 11px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: tx.type === "income" ? `${C.growth}30` : "rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CategoryIcon
                        categoryName={tx.categoryId?.name}
                        className="w-4 h-4"
                        useEmerald={tx.type === "income"}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.heroFg,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.description || "Transaction"}
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                        {tx.categoryId?.name || "General"}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      flexShrink: 0,
                      paddingLeft: 8,
                      color: tx.type === "income" ? C.highlight : "rgba(255,255,255,0.9)",
                    }}
                  >
                    {tx.type === "income" ? "+" : "−"}
                    {formatCurrency(tx.amount, cur)}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px 0",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText style={{ width: 20, color: "rgba(255,255,255,0.6)" }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.heroFg, margin: "0 0 4px", textAlign: "center" }}>
                  No transactions yet
                </p>
                <button
                  onClick={openAdd}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 38,
                    padding: "0 18px",
                    borderRadius: 999,
                    background: C.highlight,
                    color: C.highlightFg,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    ...M,
                  }}
                >
                  <Plus style={{ width: 13 }} /> Add first
                </button>
              </div>
            )}
          </div>
          <Link
            to="/app/transactions"
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              color: C.heroFg,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              ...M,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            View All Transactions <ChevronRight style={{ width: 14 }} />
          </Link>
        </div>
      </div>

      {/* 6. BUDGET BENTO */}
      {budgets?.length > 0 && (
        <div className="di">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
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
                Budget Health
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.4rem,3vw,1.9rem)",
                  fontWeight: 900,
                  color: C.foreground,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Spending Limit Tracking
              </h2>
            </div>
            <Link
              to="/app/budget"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 700,
                color: C.brand,
                textDecoration: "none",
              }}
            >
              Manage <ChevronRight style={{ width: 14 }} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
            {(budgets || []).slice(0, 4).map((b, i) => {
              const pct = Math.min(100, Math.round(((b.spentAmount || 0) / b.limitAmount) * 100));
              const schemes = [
                { bg: C.brand, fg: C.heroFg, bar: C.highlight },
                { bg: C.hero, fg: C.heroFg, bar: C.growth },
                { bg: C.growthSoft, fg: C.foreground, bar: C.growth },
                { bg: C.highlight, fg: C.highlightFg, bar: C.hero },
              ];
              const s = schemes[i % 4];
              return (
                <div
                  key={b._id}
                  style={{
                    background: s.bg,
                    borderRadius: 8,
                    padding: "clamp(1.2rem,3vw,1.6rem)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 160,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: s.fg,
                        opacity: 0.7,
                        margin: "0 0 6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {b.category?.name || "Budget"}
                    </p>
                    <div
                      style={{
                        fontSize: "clamp(1.5rem,3vw,2rem)",
                        fontWeight: 900,
                        color: s.fg,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {formatCurrency(b.limitAmount - (b.spentAmount || 0), cur)}
                    </div>
                    <p style={{ fontSize: 11, color: s.fg, opacity: 0.55, margin: "2px 0 0" }}>remaining</p>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ height: 4, background: `${s.fg}20`, borderRadius: 99, overflow: "hidden", marginBottom: 6 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: s.bar,
                          borderRadius: 99,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: s.fg, opacity: 0.6, fontWeight: 500 }}>
                        {formatCurrency(b.spentAmount || 0, cur)} spent
                      </span>
                      <span style={{ fontSize: 10, color: s.fg, opacity: 0.7, fontWeight: 700 }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. QUICK ACCESS */}
      <div className="di" style={{ background: C.altBg, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 0", borderBottom: `1px solid ${C.border}` }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: C.brand,
              margin: 0,
            }}
          >
            Quick access
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
            gap: 0,
            background: C.border,
          }}
        >
          {[
            {
              to: "/app/transactions",
              icon: ArrowUpRight,
              label: "Transactions",
              desc: "View & manage",
              accent: C.brand,
              soft: C.brandSoft,
            },
            {
              to: "/app/budget",
              icon: PieIcon,
              label: "Budget",
              desc: "Track categories",
              accent: C.growth,
              soft: C.growthSoft,
            },
            {
              to: "/app/reports",
              icon: TrendingUp,
              label: "Reports",
              desc: "Analytics",
              accent: C.brand,
              soft: C.brandSoft,
            },
            {
              to: "/app/profile",
              icon: GraduationCap,
              label: "Profile",
              desc: "Your account",
              accent: C.growth,
              soft: C.growthSoft,
            },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "18px 20px",
                  background: "#fff",
                  textDecoration: "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = q.soft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: q.soft,
                    color: q.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: 17 }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.foreground, margin: 0 }}>{q.label}</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{q.desc}</p>
                </div>
                <ChevronRight style={{ width: 14, color: C.muted, marginLeft: "auto" }} />
              </Link>
            );
          })}
        </div>
      </div>

      <AdSenseAd slot="dashboard" />

      {selectedTx && <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}

      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />
    </div>
  );
}
