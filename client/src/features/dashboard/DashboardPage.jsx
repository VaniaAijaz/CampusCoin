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
  CreditCard,
  Banknote,
  Wallet,
  PiggyBank,
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
import "./Dashboard.css";

const CATEGORY_CHART_COLORS = [
  "#2563eb", // brand blue
  "#16a34a", // growth green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate
];

const DEFAULT_STUDENT_CATEGORIES = [
  { _id: "def_food", name: "Food & Dining", icon: "utensils", color: "#F59E0B" },
  { _id: "def_transport", name: "Transport", icon: "bus", color: "#3B82F6" },
  { _id: "def_books", name: "Books & Supplies", icon: "book", color: "#8B5CF6" },
  { _id: "def_hostel", name: "Hostel & Rent", icon: "home", color: "#64748B" },
  { _id: "def_shopping", name: "Shopping", icon: "shopping-bag", color: "#EC4899" },
  { _id: "def_entertainment", name: "Entertainment", icon: "film", color: "#10B981" },
  { _id: "def_subs", name: "Subscriptions", icon: "repeat", color: "#06B6D4" },
  { _id: "def_tuition", name: "Tuition & Fees", icon: "graduation-cap", color: "#6366F1" },
];

const ChartTooltip = ({ active, payload, label, cur }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
        fontSize: 12,
        fontFamily: "var(--dash-font)",
      }}
    >
      <p style={{ fontWeight: 700, color: "#64748b", marginBottom: 6, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: "#0f172a", fontWeight: 800 }}>{formatCurrency(p.value, cur)}</span>
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
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
        fontSize: 12,
        fontFamily: "var(--dash-font)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: data.payload.fill || data.color || "#2563eb" }} />
        <span style={{ fontWeight: 800, color: "#0f172a" }}>{data.name}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <span style={{ color: "#64748b", fontSize: 11 }}>Spent:</span>
        <span style={{ fontWeight: 900, color: "#0f172a" }}>{formatCurrency(data.value, cur)}</span>
      </div>
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
  categories: DEFAULT_STUDENT_CATEGORIES,
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

  const { data } = useQuery({
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
            catsRes.status === "fulfilled" && catsRes.value?.categories?.length > 0
              ? catsRes.value.categories
              : DEFAULT_STUDENT_CATEGORIES,
        };
      } catch {
        return defaultDashboard;
      }
    },
    initialData: defaultDashboard,
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
    enabled: Boolean(isAuthenticated),
  });

  useEffect(() => {
    const handleTxUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.refetchQueries({ queryKey: ["dashboardData"] });
    };
    window.addEventListener("campuscoin:txUpdated", handleTxUpdate);
    return () => window.removeEventListener("campuscoin:txUpdated", handleTxUpdate);
  }, [queryClient]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return undefined;
    let ctx;
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      ctx = gsap.context(() => {
        gsap.fromTo(
          ".di",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity" }
        );
      }, ref);
    });
    return () => {
      cancelAnimationFrame(raf);
      ctx?.revert();
    };
  }, []);

  const { metrics, recentTx, budgets, categories } = data || defaultDashboard;
  const income = metrics?.currentMonth?.income || 0;
  const expense = metrics?.currentMonth?.expense || 0;
  const balance = metrics?.currentMonth?.netSavings ?? (income - expense);
  const savedThisMonth = metrics?.currentMonth?.savedThisMonth || 0;
  const digitalBal = metrics?.currentMonth?.digital?.balance ?? 
    (recentTx || []).filter(t => t.paymentMethod !== "Cash").reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
  const cashBal = metrics?.currentMonth?.cash?.balance ?? 
    (recentTx || []).filter(t => t.paymentMethod === "Cash").reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
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

    const sourceCats = (categories && categories.length > 0) ? categories : DEFAULT_STUDENT_CATEGORIES;
    const seenNames = new Set();
    const list = [];

    sourceCats
      .filter((c) => c.type === "expense" || !c.type)
      .forEach((cat) => {
        const normName = cat.name?.toLowerCase().trim();
        if (normName && seenNames.has(normName)) return;
        if (normName) seenNames.add(normName);

        const idKey = cat._id?.toString();
        const matched = (idKey && breakdownMap[idKey]) || (normName && breakdownMap[normName]);

        list.push({
          _id: cat._id,
          name: cat.name,
          icon: cat.icon || "tag",
          color: cat.color || "#2563eb",
          total: matched ? Number(matched.total) || 0 : 0,
          count: matched ? Number(matched.count) || 0 : 0,
        });
      });

    return list.sort((a, b) => b.total - a.total);
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

  if (!isAuthenticated && !isAuthLoading) return <Navigate to="/login" replace />;
  if (isAuthLoading) return <DashboardSkeleton />;

  return (
    <div ref={ref} className="dash-root" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── 1. FROSTED LIGHT HERO BALANCE CARD ── */}
      <div
        className="di"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
          border: "1px solid rgba(219, 234, 254, 0.9)",
          borderRadius: 20,
          padding: "clamp(1.6rem, 3.5vw, 2.2rem)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px -5px rgba(37, 99, 235, 0.07), 0 2px 6px rgba(15, 23, 42, 0.02)",
        }}
      >
        {/* Soft Radial Ambient Glow */}
        <div
          style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header Tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 12px",
              borderRadius: 9999,
              background: "#eff6ff",
              border: "1px solid #dbeafe",
              fontSize: 12,
              fontWeight: 700,
              color: "#2563eb",
              marginBottom: 16,
            }}
          >
            <Sparkles style={{ width: 14, height: 14, color: "#2563eb" }} />
            <span>{month} · Net Balance</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 28,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Left Balance Display */}
            <div>
              <div
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                  marginBottom: 16,
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
                    background: balance >= 0 ? "#dcfce7" : "#fee2e2",
                    border: `1px solid ${balance >= 0 ? "#bbf7d0" : "#fecdd3"}`,
                    borderRadius: 9999,
                    padding: "6px 14px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: balance >= 0 ? "#16a34a" : "#dc2626",
                  }}
                >
                  {balance >= 0 ? (
                    <>
                      <ArrowUpRight style={{ width: 14, height: 14 }} /> Positive cash flow
                    </>
                  ) : (
                    <>
                      <ArrowDownRight style={{ width: 14, height: 14 }} /> Deficit cash flow
                    </>
                  )}
                </span>

                <button onClick={openAdd} className="dash-btn-primary" style={{ height: 38, padding: "0 20px" }}>
                  <Plus style={{ width: 15, height: 15 }} />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {/* Right Financial Breakdown Pods */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, minWidth: 280 }}>
              {[
                { label: "Digital Bank", value: digitalBal, color: "#2563eb", bg: "#eff6ff", border: "#dbeafe", icon: <CreditCard style={{ width: 14, height: 14 }} /> },
                { label: "Cash in Hand", value: cashBal, color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: <Banknote style={{ width: 14, height: 14 }} /> },
                { label: "Income", value: income, color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: <ArrowUpRight style={{ width: 14, height: 14 }} /> },
                { label: "Expense", value: expense, color: "#dc2626", bg: "#fee2e2", border: "#fecdd3", icon: <ArrowDownRight style={{ width: 14, height: 14 }} /> },
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    background: "#ffffff",
                    border: `1px solid ${t.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: t.color }}>{t.icon}</span>
                    <span style={{ fontSize: 10.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
                    <NumberTicker value={t.value} currencyCode={cur} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. 4-KPI SUMMARY STRIP ── */}
      <div className="dash-kpi-grid">
        {/* Total Income */}
        <div className="dash-kpi-card di">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Income</span>
            <div className="dash-kpi-icon-box" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <ArrowUpRight style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#16a34a" }}>
            {formatCurrency(income, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#dcfce7", color: "#16a34a" }}>
              This month
            </span>
            <span className="dash-kpi-hint">Total cash inflows</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="dash-kpi-card di">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Expenses</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <ArrowDownRight style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#0f172a" }}>
            {formatCurrency(expense, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#fee2e2", color: "#dc2626" }}>
              This month
            </span>
            <span className="dash-kpi-hint">Total cash outflows</span>
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="dash-kpi-card di">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Budget Remaining</span>
            <div className="dash-kpi-icon-box" style={{ background: avail >= 0 ? "#dcfce7" : "#fee2e2", color: avail >= 0 ? "#16a34a" : "#dc2626" }}>
              <Target style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: avail >= 0 ? "#16a34a" : "#dc2626" }}>
            {avail >= 0 ? formatCurrency(avail, cur) : `-${formatCurrency(Math.abs(avail), cur)}`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: avail >= 0 ? "#dcfce7" : "#fee2e2", color: avail >= 0 ? "#16a34a" : "#dc2626" }}>
              {budgets?.length || 0} active
            </span>
            <span className="dash-kpi-hint">Budgets configured</span>
          </div>
        </div>

        {/* Saved This Month */}
        <div className="dash-kpi-card di">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Monthly Savings</span>
            <div className="dash-kpi-icon-box" style={{ background: savedThisMonth > 0 ? "#eff6ff" : "#f1f5f9", color: savedThisMonth > 0 ? "#2563eb" : "#64748b" }}>
              <PiggyBank style={{ width: 18, height: 18 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: savedThisMonth > 0 ? "#2563eb" : "#0f172a" }}>
            {formatCurrency(savedThisMonth, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: savedThisMonth > 0 ? "#eff6ff" : "#f1f5f9", color: savedThisMonth > 0 ? "#2563eb" : "#64748b" }}>
              Achieved
            </span>
            <span className="dash-kpi-hint">Recent records</span>
          </div>
        </div>
      </div>

      {/* ── 3. CATEGORY SPENDING OVERVIEW ── */}
      <div className="di" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2563eb" }}>
                Expense Breakdown
              </span>
            </div>
            <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.65rem)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              Student Spending by Category
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "3px 0 0", fontWeight: 500 }}>
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
                  borderRadius: 9999,
                  background: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid #dbeafe",
                }}
              >
                🔥 Top Spend: <strong>{topCategory.name}</strong> ({formatCurrency(topCategory.total, cur)})
              </span>
            )}
            <Link to="/app/categories" className="dash-btn-secondary" style={{ height: 36, fontSize: 12.5, padding: "0 14px" }}>
              <span>Categories Tab</span>
              <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>

        {/* Donut Chart + Category Grid */}
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: activeCategoriesWithSpending.length > 0 ? "320px 1fr" : "1fr" }}>
          {/* Donut Distribution */}
          {activeCategoriesWithSpending.length > 0 && (
            <div className="dash-card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                    Active Share
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: 9999 }}>
                    {activeCategoriesWithSpending.length} Active
                  </span>
                </div>

                <div style={{ height: 180, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={74}
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
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      Total Spent
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
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
                  borderTop: "1px solid #f1f5f9",
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
                      <span style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {cat.name}
                      </span>
                      <span style={{ fontWeight: 800, color: "#0f172a", flexShrink: 0 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Category Portfolio Cards */}
          <div className="dash-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Categories & Monthly Spending
              </h3>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                {categoriesList.length} categories · Total: <strong>{formatCurrency(totalCategorizedExpense, cur)}</strong>
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
                maxHeight: 290,
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
                      borderRadius: 12,
                      background: hasSpent ? "#f8fafc" : "#ffffff",
                      border: `1px solid ${hasSpent ? "#e2e8f0" : "#f1f5f9"}`,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${catColor}18`,
                            color: catColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <CategoryIcon categoryName={cat.name} className="w-4 h-4" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {cat.name}
                          </p>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {hasSpent ? `${cat.count} txs · ${pct}% of total` : "0 transactions"}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: 13.5, fontWeight: 900, color: hasSpent ? "#0f172a" : "#94a3b8", letterSpacing: "-0.02em", flexShrink: 0 }}>
                        {formatCurrency(spent, cur)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
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
          </div>
        </div>
      </div>

      {/* ── 4. BENTO: TRENDS CHART + RECENT TRANSACTIONS ── */}
      <div className="di" style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 340px" }}>
        {/* Cash Flow Trends Chart */}
        <div className="dash-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2563eb", marginBottom: 2 }}>
                6-Month Overview
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Income vs. Expenses
              </h3>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9999, padding: "4px 10px" }}>
              Past 6 Months
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 230 }}>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, cur)} />
                <Tooltip content={<ChartTooltip cur={cur} />} cursor={{ stroke: "rgba(37,99,235,0.2)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2.5} fill="url(#gi)" dot={{ r: 3, fill: "#16a34a", strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#2563eb" strokeWidth={2.5} fill="url(#ge)" dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: "1px solid #f1f5f9", marginTop: 8 }}>
            {[
              { l: "Income", c: "#16a34a" },
              { l: "Expense", c: "#2563eb" },
            ].map((x) => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: x.c, display: "block" }} />
                {x.l}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Card (Clean Light SaaS Card) */}
        <div className="dash-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2563eb", marginBottom: 2 }}>
                Activity
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Recent Transactions
              </h3>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb" }}>
              {recentTx?.length || 0}
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {displayTx.length > 0 ? (
              displayTx.map((tx) => {
                const isInc = tx.type === "income";
                return (
                  <div
                    key={tx._id}
                    onClick={() => setSelectedTx(tx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: isInc ? "#dcfce7" : "#eff6ff",
                          color: isInc ? "#16a34a" : "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CategoryIcon categoryName={tx.categoryId?.name} className="w-4 h-4" useEmerald={isInc} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.description || "Transaction"}
                        </p>
                        <p style={{ fontSize: 10.5, color: "#64748b", margin: 0 }}>
                          {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {tx.categoryId?.name || "General"}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0, paddingLeft: 6, color: isInc ? "#16a34a" : "#0f172a" }}>
                      {isInc ? "+ " : "− "}
                      {formatCurrency(tx.amount, cur)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b", margin: 0 }}>No transactions yet</p>
                <button onClick={openAdd} className="dash-btn-primary" style={{ height: 32, fontSize: 12, padding: "0 12px" }}>
                  <Plus style={{ width: 13, height: 13 }} /> Add first
                </button>
              </div>
            )}
          </div>

          <Link
            to="/app/transactions"
            className="dash-btn-secondary"
            style={{ width: "100%", height: 36, fontSize: 12.5, justifyContent: "center" }}
          >
            <span>View All Transactions</span>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>

      {/* ── 5. BUDGET HEALTH CARDS ── */}
      {budgets?.length > 0 && (
        <div className="di" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2563eb", marginBottom: 2 }}>
                Budget Health
              </div>
              <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.65rem)", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                Spending Limit Tracking
              </h2>
            </div>
            <Link to="/app/budget" className="dash-btn-secondary" style={{ height: 34, fontSize: 12, padding: "0 12px" }}>
              <span>Manage Budgets</span>
              <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {(budgets || []).slice(0, 4).map((b) => {
              const spent = b.spentAmount || 0;
              const limit = b.limitAmount || 100;
              const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
              const isOver = rawPct >= 100;
              const pct = isOver ? 100 : Math.round(rawPct);
              const remaining = limit - spent;

              return (
                <div key={b._id} className="dash-card" style={{ padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {b.categoryId?.name || b.category?.name || "Budget"}
                      </p>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 9999,
                          background: isOver ? "#fee2e2" : "#dcfce7",
                          color: isOver ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {isOver ? "Exceeded" : `${pct}% spent`}
                      </span>
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 900, color: isOver ? "#dc2626" : "#0f172a", letterSpacing: "-0.02em" }}>
                      {remaining >= 0 ? formatCurrency(remaining, cur) : `-${formatCurrency(Math.abs(remaining), cur)}`}
                    </div>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{remaining >= 0 ? "remaining" : "over limit"}</p>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isOver ? "#dc2626" : pct >= 75 ? "#f59e0b" : "#16a34a",
                          borderRadius: 99,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#64748b" }}>
                      <span>{formatCurrency(spent, cur)} used</span>
                      <span>Cap: {formatCurrency(limit, cur)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. QUICK ACCESS LINKS ── */}
      <div className="dash-card di" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2563eb", marginBottom: 12 }}>
          Quick Access
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          {[
            { to: "/app/transactions", icon: ArrowUpRight, label: "Transactions", desc: "View & record", color: "#2563eb", bg: "#eff6ff" },
            { to: "/app/budget", icon: PieIcon, label: "Budget", desc: "Monthly limits", color: "#16a34a", bg: "#dcfce7" },
            { to: "/app/reports", icon: TrendingUp, label: "Reports", desc: "Analytics & PDF", color: "#8b5cf6", bg: "#f3e8ff" },
            { to: "/app/profile", icon: GraduationCap, label: "Profile", desc: "Preferences", color: "#f59e0b", bg: "#fef3c7" },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: q.bg,
                    color: q.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }}>{q.label}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{q.desc}</p>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: "#94a3b8", marginLeft: "auto" }} />
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
