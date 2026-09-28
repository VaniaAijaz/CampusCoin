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
  Wallet,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
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
import "./Dashboard.css";

const CATEGORY_CHART_COLORS = [
  "#2563eb", // brand blue
  "#16a34a", // emerald green
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f59e0b", // amber
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

const formatCompactAxis = (val, cur = "USD") => {
  const num = Math.abs(Number(val) || 0);
  const prefix = val < 0 ? "-" : "";
  const symbol = cur === "PKR" ? "Rs " : cur === "EUR" ? "€" : "$";
  if (num >= 1e9) return `${prefix}${symbol}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${prefix}${symbol}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${prefix}${symbol}${(num / 1e3).toFixed(0)}k`;
  return `${prefix}${symbol}${num}`;
};

const ChartTooltip = ({ active, payload, label, cur }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
        fontSize: 12,
        fontFamily: "var(--dash-font)",
      }}
    >
      <p style={{ fontWeight: 800, color: "#64748b", marginBottom: 6, fontSize: 11, textTransform: "uppercase" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 2 }}>
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
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
        fontSize: 12,
        fontFamily: "var(--dash-font)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: data.payload.fill || data.color || "#2563eb",
          }}
        />
        <span style={{ fontWeight: 800, color: "#0f172a" }}>{data.name}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <span style={{ color: "#64748b", fontSize: 11 }}>Spent:</span>
        <span style={{ fontWeight: 800, color: "#0f172a" }}>{formatCurrency(data.value, cur)}</span>
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
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".dash-anim",
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: "power2.out", clearProps: "transform,opacity" }
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
        const spentData = breakdownMap[idKey] || breakdownMap[normName];
        const total = spentData ? Number(spentData.total) || 0 : 0;
        const count = spentData ? Number(spentData.count) || 0 : 0;

        list.push({
          ...cat,
          total,
          count,
        });
      });

    return list.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
  }, [categories, metrics?.categoryBreakdown]);

  const totalCategorizedExpense = useMemo(() => {
    return categoriesList.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  }, [categoriesList]);

  const activeCategoriesWithSpending = useMemo(() => {
    return categoriesList.filter((c) => Number(c.total) > 0);
  }, [categoriesList]);

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
    <div ref={ref} className="dash-root">
      {/* ── 1. CLEAN PAGE HEADER ── */}
      <div className="dash-page-header dash-anim">
        <div>
          <h1 className="dash-page-title">
            Welcome back, {user?.name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="dash-page-desc">
            Here is your financial summary for {month}.
          </p>
        </div>

        <div className="dash-page-actions">
          <button onClick={openAdd} className="dash-btn-primary">
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* ── 2. CLEAN 4-METRIC SUMMARY CARDS ── */}
      <div className="dash-kpi-grid dash-anim">
        {/* Total Net Balance Card */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Balance</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
              <Wallet size={17} />
            </div>
          </div>
          <div className="dash-kpi-val">
            <NumberTicker value={balance} currencyCode={cur} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className={`dash-cashflow-pill ${balance >= 0 ? "positive" : "negative"}`} style={{ padding: "2px 8px", fontSize: "11px" }}>
              {balance >= 0 ? "+ Positive Flow" : "- Overspent"}
            </span>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Monthly Income</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-emerald-soft)", color: "var(--dash-emerald)" }}>
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "var(--dash-emerald)" }}>
            <NumberTicker value={income} currencyCode={cur} />
          </div>
          <div className="dash-kpi-hint">Allowances & earnings</div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Monthly Spending</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-danger-soft)", color: "var(--dash-danger)" }}>
              <ArrowDownRight size={17} />
            </div>
          </div>
          <div className="dash-kpi-val">
            <NumberTicker value={expense} currencyCode={cur} />
          </div>
          <div className="dash-kpi-hint">Total spent this month</div>
        </div>

        {/* Budget Remaining Card */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Budget Remaining</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-purple-soft)", color: "var(--dash-purple)" }}>
              <Target size={17} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: avail >= 0 ? "var(--dash-foreground)" : "var(--dash-danger)" }}>
            <NumberTicker value={avail} currencyCode={cur} />
          </div>
          <div className="dash-kpi-hint">{budgets?.length || 0} active category limits</div>
        </div>
      </div>

      {/* ── 3. CASH FLOW OVERVIEW & CATEGORY BREAKDOWN ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }} className="dash-anim">
        {/* Cash Flow Area Chart */}
        <div className="dash-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Spending & Income Trend</h3>
              <p className="dash-card-subtitle">Monthly cash flow trajectory</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "var(--dash-muted)", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                Income
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "var(--dash-muted)", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
                Expenses
              </div>
            </div>
          </div>

          <div style={{ height: 230, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--dash-font)" />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  width={52}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompactAxis(v, cur)}
                  fontFamily="var(--dash-font)"
                />
                <Tooltip content={<ChartTooltip cur={cur} />} cursor={{ stroke: "rgba(37, 99, 235, 0.15)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2.5} fill="url(#incomeGrad)" dot={false} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#2563eb" strokeWidth={2.5} fill="url(#expenseGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category Donut Chart */}
        <div className="dash-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Spending by Category</h3>
              <p className="dash-card-subtitle">Where your money went this month</p>
            </div>
            <Link to="/app/categories" style={{ fontSize: "12px", color: "var(--dash-blue)", fontWeight: 700, textDecoration: "none" }}>
              View All
            </Link>
          </div>

          {activeCategoriesWithSpending.length > 0 ? (
            <div>
              <div style={{ height: 160, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryPieTooltip cur={cur} />} />
                  </PieChart>
                </ResponsiveContainer>

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
                  <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Total Spent
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                    {formatCurrency(totalCategorizedExpense, cur)}
                  </span>
                </div>
              </div>

              {/* Compact Legend */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 10px",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                  marginTop: "6px",
                }}
              >
                {activeCategoriesWithSpending.slice(0, 4).map((cat, i) => {
                  const pct =
                    totalCategorizedExpense > 0
                      ? Math.round(((Number(cat.total) || 0) / totalCategorizedExpense) * 100)
                      : 0;
                  return (
                    <div key={cat._id || i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: cat.color || CATEGORY_CHART_COLORS[i % CATEGORY_CHART_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontWeight: 500 }}>
                        {cat.name}
                      </span>
                      <span style={{ fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--dash-muted)", fontSize: "12.5px" }}>
              No expenses logged yet this month.
            </div>
          )}
        </div>
      </div>

      {/* ── 4. SMART MONEY TIPS ── */}
      <div className="dash-anim">
        <AiInsightsDashboardWidget />
      </div>

      {/* ── 5. RECENT TRANSACTIONS TABLE ── */}
      <div className="dash-card dash-anim">
        <div className="dash-card-header">
          <div>
            <h3 className="dash-card-title">Recent Transactions</h3>
            <p className="dash-card-subtitle">Your latest expenses and income</p>
          </div>
          <Link
            to="/app/transactions"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: "12.5px",
              fontWeight: 700,
              color: "var(--dash-blue)",
              textDecoration: "none",
            }}
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {displayTx.length > 0 ? (
          <div className="dash-table-container">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayTx.map((tx) => {
                  const isExp = tx.type === "expense";
                  return (
                    <tr key={tx._id} onClick={() => setSelectedTx(tx)} style={{ cursor: "pointer" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: isExp ? "var(--dash-alt-bg)" : "var(--dash-emerald-soft)",
                              color: isExp ? "var(--dash-muted)" : "var(--dash-emerald)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <CategoryIcon icon={tx.category_id?.icon || tx.category?.icon || (isExp ? "shopping-bag" : "arrow-up-right")} size={15} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: "var(--dash-foreground)", margin: 0 }}>
                              {tx.description || tx.title || "Transaction"}
                            </p>
                            {tx.payment_method && (
                              <p style={{ fontSize: "11px", color: "var(--dash-muted)", margin: 0, textTransform: "capitalize" }}>
                                {tx.payment_method}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: 9999,
                            background: "var(--dash-alt-bg)",
                            border: "1px solid var(--dash-border)",
                            color: "var(--dash-foreground)",
                          }}
                        >
                          {tx.category_id?.name || tx.category?.name || "General"}
                        </span>
                      </td>
                      <td style={{ color: "var(--dash-muted)", fontSize: "12px" }}>
                        {new Date(tx.date || tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 800, fontSize: "13.5px", color: isExp ? "var(--dash-foreground)" : "var(--dash-emerald)" }}>
                          {isExp ? "-" : "+"}{formatCurrency(tx.amount, cur)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dash-empty-box" style={{ padding: "32px 16px" }}>
            <p className="dash-empty-title">No transactions yet</p>
            <p className="dash-empty-desc">Add your first expense or income to start tracking.</p>
            <button onClick={openAdd} className="dash-btn-primary">
              <Plus size={15} />
              <span>Add Transaction</span>
            </button>
          </div>
        )}
      </div>

      <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      <AdSenseAd slot="dashboard_bottom" />
    </div>
  );
}
