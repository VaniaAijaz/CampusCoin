import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Wallet, Target,
  Plus, ArrowRight, Lightbulb, AlertTriangle, RefreshCw
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import Spinner from "../components/ui/Spinner";
import AddTransactionModal from "../components/transactions/AddTransactionModal";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement, Filler
);

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff",
      borderColor: "#E4E5E6",
      borderWidth: 1,
      titleColor: "#29292E",
      bodyColor: "#6B6D75",
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
      titleFont: { family: "Inter", size: 12, weight: "600" },
      bodyFont: { family: "Inter", size: 12 },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: "Inter", size: 11 }, color: "#9A9CA4" },
    },
    y: {
      grid: { color: "#F0F2F5", lineWidth: 1 },
      border: { display: false, dash: [4, 4] },
      ticks: { font: { family: "Inter", size: 11 }, color: "#9A9CA4", callback: (v) => `$${v}` },
    },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState("expense");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { income: 0, expense: 0, balance: 0 },
    sixMonths: [],
    byCategory: [],
    recentTx: [],
    tips: [],
    budgetAlerts: [],
    topCategory: null,
    forecast: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, sixMonths, byCategory, recentTx, tips, budgetAlerts, topCat, forecast] = await Promise.all([
        api.get("/reports/monthly-summary"),
        api.get("/reports/six-months"),
        api.get("/reports/by-category"),
        api.get("/transactions/recent"),
        api.get("/tips"),
        api.get("/budgets/alerts"),
        api.get("/reports/top-category"),
        api.get("/tips/forecast"),
      ]);
      setData({
        summary: summary.data,
        sixMonths: sixMonths.data.data || [],
        byCategory: byCategory.data.data || [],
        recentTx: recentTx.data.transactions || [],
        tips: tips.data.tips || [],
        budgetAlerts: budgetAlerts.data.alerts || [],
        topCategory: topCat.data.topCategory,
        forecast: forecast.data.forecast,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddClose = (refreshed) => {
    setAddOpen(false);
    if (refreshed) load();
  };

  // Six-month bar chart data
  const barData = {
    labels: data.sixMonths.map((d) => d.month),
    datasets: [
      {
        label: "Income",
        data: data.sixMonths.map((d) => d.income),
        backgroundColor: "#0118A3",
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
      {
        label: "Expense",
        data: data.sixMonths.map((d) => d.expense),
        backgroundColor: "#B5C9E0",
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
    ],
  };

  // Spending by category donut
  const donutColors = [
    "#0118A3", "#3956BB", "#B5C9E0", "#B9A572", "#9A9CA4",
    "#6B6D75", "#E97B4F", "#4B9B6F"
  ];
  const donutData = {
    labels: data.byCategory.slice(0, 6).map((c) => c.name),
    datasets: [{
      data: data.byCategory.slice(0, 6).map((c) => c.total),
      backgroundColor: donutColors,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      hoverOffset: 4,
    }],
  };

  // Line chart for 6-month balance trend
  const lineData = {
    labels: data.sixMonths.map((d) => d.month),
    datasets: [{
      label: "Balance",
      data: data.sixMonths.map((d) => d.income - d.expense),
      borderColor: "#0118A3",
      borderWidth: 2,
      backgroundColor: "rgba(1,24,163,0.06)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#0118A3",
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  };

  const { income, expense, balance } = data.summary;

  if (loading) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Greeting */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--color-dark)" }}>
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p style={{ fontSize: 13, color: "var(--color-subtle)", margin: "4px 0 0" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cc-btn-secondary" onClick={load} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button className="cc-btn-secondary" onClick={() => { setAddType("income"); setAddOpen(true); }}>
            <Plus size={15} /> Add Income
          </button>
          <button className="cc-btn-primary" onClick={() => { setAddType("expense"); setAddOpen(true); }}>
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* Budget Alerts Banner */}
      {data.budgetAlerts.length > 0 && (
        <div style={{
          background: "var(--color-warning-bg)",
          border: "1px solid #FCD34D",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}>
          <AlertTriangle size={16} color="var(--color-warning)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "var(--color-warning-text)" }}>
            <strong>Budget Alerts:</strong>{" "}
            {data.budgetAlerts.slice(0, 2).map((a, i) => (
              <span key={i}>
                {a.budget.categoryId?.name} is at {a.percent}%{a.isOver ? " (over budget!)" : ""}{i < Math.min(data.budgetAlerts.length, 2) - 1 ? " · " : ""}
              </span>
            ))}
            {data.budgetAlerts.length > 2 && ` and ${data.budgetAlerts.length - 2} more.`}
            <button onClick={() => navigate("/budget")} style={{ background: "none", border: "none", color: "var(--color-warning)", fontWeight: 600, cursor: "pointer", fontSize: 13, marginLeft: 6, padding: 0, textDecoration: "underline" }}>
              View budgets →
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total Income"
          value={fmt(income)}
          sub="This month"
          icon={<TrendingUp size={18} />}
          color="var(--color-success)"
        />
        <StatCard
          label="Total Expenses"
          value={fmt(expense)}
          sub="This month"
          icon={<TrendingDown size={18} />}
          color="var(--color-danger)"
        />
        <StatCard
          label="Balance"
          value={fmt(balance)}
          sub={balance >= 0 ? "You're on track!" : "Spending over income"}
          icon={<Wallet size={18} />}
          color={balance >= 0 ? "var(--color-brand)" : "var(--color-danger)"}
        />
        <StatCard
          label="Savings Goal"
          value={fmt(user?.monthlySavingsGoal || 0)}
          sub={`Saved: ${fmt(Math.max(0, balance))}`}
          icon={<Target size={18} />}
          color="var(--color-gold)"
        />
        {data.topCategory && (
          <StatCard
            label="Top Expense Category"
            value={data.topCategory.category?.name || "—"}
            sub={fmt(data.topCategory.total)}
            icon={<TrendingDown size={18} />}
            color="var(--color-secondary)"
          />
        )}
        {data.forecast && (
          <StatCard
            label="Next Month Forecast"
            value={fmt(data.forecast.expense)}
            sub={`Expected income: ${fmt(data.forecast.income)}`}
            icon={<TrendingUp size={18} />}
            color="var(--color-gold)"
          />
        )}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Bar Chart — 6 months */}
        <div className="cc-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Income vs Expenses</div>
              <div style={{ fontSize: 12, color: "var(--color-subtle)" }}>Last 6 months overview</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#0118A3", display: "inline-block" }} />
                Income
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#B5C9E0", display: "inline-block" }} />
                Expenses
              </span>
            </div>
          </div>
          {data.sixMonths.length > 0 ? (
            <div style={{ height: 220 }}>
              <Bar data={barData} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }} />
            </div>
          ) : (
            <EmptyState icon={<TrendingUp size={22} />} title="No data yet" description="Add some transactions to see your trend." />
          )}
        </div>

        {/* Donut Chart — spending by category */}
        <div className="cc-card">
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Spending by Category</div>
            <div style={{ fontSize: 12, color: "var(--color-subtle)" }}>This month</div>
          </div>
          {data.byCategory.length > 0 ? (
            <div>
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Doughnut
                  data={donutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "68%",
                    plugins: {
                      legend: { display: false },
                      tooltip: CHART_DEFAULTS.plugins.tooltip,
                    },
                  }}
                />
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {data.byCategory.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: donutColors[i], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-dark)" }}>{fmt(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={<TrendingDown size={22} />} title="No expenses yet" description="Start logging your expenses." />
          )}
        </div>
      </div>

      {/* Balance Trend Line Chart */}
      {data.sixMonths.length > 0 && (
        <div className="cc-card" style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Balance Trend</div>
            <div style={{ fontSize: 12, color: "var(--color-subtle)" }}>6-month net balance</div>
          </div>
          <div style={{ height: 140 }}>
            <Line data={lineData} options={{
              ...CHART_DEFAULTS,
              scales: {
                ...CHART_DEFAULTS.scales,
                y: { ...CHART_DEFAULTS.scales.y, grid: { color: "#F0F2F5" } },
              },
            }} />
          </div>
        </div>
      )}

      {/* Bottom Row — Recent Transactions + Saving Tips + Budget Progress */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* Recent Transactions */}
        <div className="cc-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Recent Transactions</div>
            <button
              onClick={() => navigate("/transactions")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-brand)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          {data.recentTx.length === 0 ? (
            <EmptyState
              icon={<Wallet size={22} />}
              title="No transactions yet"
              description="Add your first transaction above."
              action={
                <button className="cc-btn-primary" style={{ fontSize: 12, height: 34 }} onClick={() => { setAddType("expense"); setAddOpen(true); }}>
                  <Plus size={13} /> Add Transaction
                </button>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.recentTx.map((tx) => (
                <div key={tx._id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--color-border)",
                }}>
                  <div className="icon-box" style={{
                    background: tx.type === "income" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                    color: tx.type === "income" ? "var(--color-success)" : "var(--color-danger)",
                  }}>
                    {tx.type === "income" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.description || tx.categoryId?.name || "Transaction"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-subtle)", marginTop: 2 }}>
                      {tx.categoryId?.name} · {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: tx.type === "income" ? "var(--color-success)" : "var(--color-danger)", whiteSpace: "nowrap" }}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saving Tips + Budget Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Saving Tips */}
          <div className="cc-card" style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Lightbulb size={16} color="var(--color-gold)" />
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Saving Tips</div>
            </div>
            {data.tips.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--color-subtle)", lineHeight: 1.6 }}>
                Keep tracking your transactions to get personalised saving tips. 💡
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.tips.slice(0, 3).map((tip, i) => (
                  <div key={tip.id || i} style={{
                    background: i === 0 ? "var(--color-gold-light)" : "var(--color-page)",
                    borderRadius: 9,
                    padding: "10px 12px",
                    display: "flex",
                    gap: 10,
                  }}>
                    <Lightbulb size={14} color={i === 0 ? "var(--color-gold)" : "var(--color-subtle)"} style={{ marginTop: 1, flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.5 }}>{tip.message}</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate("/insights")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-brand)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 12, padding: 0 }}>
              View all insights <ArrowRight size={13} />
            </button>
          </div>

          {/* Budget Progress */}
          {data.budgetAlerts.length > 0 && (
            <div className="cc-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-dark)" }}>Budget Alerts</div>
                <button onClick={() => navigate("/budget")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-brand)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  Manage <ArrowRight size={13} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.budgetAlerts.slice(0, 3).map((a, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-dark)" }}>
                        {a.budget.categoryId?.name}
                      </span>
                      <span style={{ fontSize: 11, color: a.isOver ? "var(--color-danger)" : "var(--color-warning)", fontWeight: 600 }}>
                        {a.percent}%
                      </span>
                    </div>
                    <ProgressBar value={a.budget.spentAmount} max={a.budget.limitAmount} showLabel={false} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={addOpen}
        onClose={handleAddClose}
        defaultType={addType}
      />

      <style>{`
        @media (max-width: 1024px) {
          .dashboard-charts { grid-template-columns: 1fr !important; }
          .dashboard-bottom { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .dashboard-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
