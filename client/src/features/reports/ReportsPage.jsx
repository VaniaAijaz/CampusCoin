import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3, Calendar, Download,
  PieChart as PieIcon, TrendingUp, Tag,
  ArrowUpRight, ArrowDownRight, Layers,
} from "lucide-react";
import {
  getMonthlySummary, getReportByCategory,
  getSixMonthsTrends, getDailyReport, getTopCategory,
} from "./reportsApi";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import toast from "react-hot-toast";
import { formatCurrency } from "../../utils/currencyUtils";
import { generateStatementPDF } from "./StatementGenerator";
import { useAuth } from "../auth/AuthContext";
import AdSenseAd from "../../components/ads/AdSenseAd";
import "../dashboard/Dashboard.css";

/* Clean harmonious chart palette */
const CHART_COLORS = [
  "#2563eb", // Blue
  "#16a34a", // Emerald
  "#7c3aed", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#64748b", // Slate
  "#8b5cf6", // Violet
];

/* Custom clean tooltip */
const ChartTip = ({ active, payload, label, cur }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
      fontSize: "12px",
      fontFamily: "var(--dash-font)",
    }}>
      <p style={{ fontWeight: 700, color: "#64748b", marginBottom: 6, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 2 }}>
          <span style={{ color: p.fill || p.color, fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: "#0f172a", fontWeight: 800 }}>{formatCurrency(p.value, cur)}</span>
        </div>
      ))}
    </div>
  );
};

const formatCompactAxis = (val, cur = "USD") => {
  const num = Math.abs(Number(val) || 0);
  const prefix = val < 0 ? "-" : "";
  const symbol = cur === "PKR" ? "Rs " : cur === "EUR" ? "€" : "$";
  if (num >= 1e9) return `${prefix}${symbol}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${prefix}${symbol}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${prefix}${symbol}${(num / 1e3).toFixed(0)}k`;
  return `${prefix}${symbol}${num}`;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [sixMonths, setSixMonths] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [topCat, setTopCat] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── All API logic exactly preserved ── */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, sixRes, dailyRes, topRes] = await Promise.all([
        getMonthlySummary(endDate),
        getReportByCategory(endDate, "expense"),
        getSixMonthsTrends(),
        getDailyReport(endDate),
        getTopCategory(),
      ]);
      if (sumRes.success) setSummary(sumRes);
      if (catRes.success) setCategoryData(catRes.data || []);
      if (sixRes.success) setSixMonths(sixRes.data || []);
      if (dailyRes.success) setDailyData(dailyRes.data || []);
      if (topRes.success) setTopCat(topRes.topCategory);
    } catch {
      toast.error("Couldn't load spending reports.");
    } finally {
      setLoading(false);
    }
  }, [endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formattedDaily = useMemo(() => {
    if (!dailyData?.length) return [];
    const map = {};
    dailyData.forEach(item => {
      const day = item._id?.day;
      const type = item._id?.type;
      if (!map[day]) map[day] = { day: `Day ${day}`, income: 0, expense: 0 };
      if (type === "income") map[day].income = item.total;
      else if (type === "expense") map[day].expense = item.total;
    });
    return Object.values(map);
  }, [dailyData]);

  const pieData = useMemo(() => {
    return categoryData.map((cat, i) => ({
      ...cat,
      fill: cat.color || CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [categoryData]);

  const handleDownloadPDF = () => generateStatementPDF(user, endDate);

  const inc = summary?.income || 0;
  const exp = summary?.expense || 0;
  const bal = summary?.balance || 0;

  return (
    <div className="dash-root">
      {/* ── PAGE HEADER ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Spending Insights</h1>
          <p className="dash-page-desc">Understand your spending habits and track where your money goes.</p>
        </div>
        <div className="dash-page-actions">
          <input
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="dash-input"
            style={{ width: "auto", height: "42px", padding: "0 14px" }}
          />
          <button onClick={handleDownloadPDF} className="dash-btn-primary">
            <Download size={15} />
            <span>Download Statement</span>
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="dash-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Income</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-emerald-soft)", color: "var(--dash-emerald)" }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "var(--dash-emerald)" }}>
            {formatCurrency(inc, user?.currency)}
          </div>
          <div className="dash-kpi-hint">Stipends, shifts & allowances</div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Expenses</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "var(--dash-foreground)" }}>
            {formatCurrency(exp, user?.currency)}
          </div>
          <div className="dash-kpi-hint">All campus & personal spending</div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Net Savings</span>
            <div className="dash-kpi-icon-box" style={{
              background: bal >= 0 ? "var(--dash-emerald-soft)" : "var(--dash-danger-soft)",
              color: bal >= 0 ? "var(--dash-emerald)" : "var(--dash-danger)",
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: bal >= 0 ? "var(--dash-emerald)" : "var(--dash-danger)" }}>
            {bal >= 0 ? "+" : "-"}{formatCurrency(Math.abs(bal), user?.currency)}
          </div>
          <div className="dash-kpi-hint">{bal >= 0 ? "You saved money this period" : "Spending exceeded your income"}</div>
        </div>
      </div>

      {/* ── BENTO: SPENDING BY CATEGORY & TOP CATEGORIES ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
        {/* Category Breakdown Donut */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Spending by Category</h3>
              <p className="dash-card-subtitle">Distribution of your expenses</p>
            </div>
          </div>

          {categoryData.length > 0 ? (
            <div>
              <div style={{ height: 240, width: "100%", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip cur={user?.currency} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "8px 12px",
                paddingTop: "16px",
                borderTop: "1px solid var(--dash-border)",
                marginTop: "12px",
              }}>
                {categoryData.map((cat, i) => (
                  <div key={cat._id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: cat.color || CHART_COLORS[i % CHART_COLORS.length],
                      flexShrink: 0,
                    }} />
                    <span style={{ color: "var(--dash-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontWeight: 500 }}>
                      {cat.name}
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--dash-foreground)", flexShrink: 0 }}>
                      {formatCurrency(cat.total, user?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dash-empty-box" style={{ padding: "40px 16px" }}>
              <p className="dash-empty-title">No expenses yet</p>
              <p className="dash-empty-desc">Add expenses to see your category breakdown.</p>
            </div>
          )}
        </div>

        {/* Top Spending Categories List */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Top Spending Categories</h3>
              <p className="dash-card-subtitle">Highest spending areas ranked</p>
            </div>
          </div>

          {categoryData.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {categoryData.map((cat, i) => {
                const maxTotal = Math.max(...categoryData.map(c => c.total || 0));
                const pct = maxTotal > 0 ? ((cat.total || 0) / maxTotal) * 100 : 0;
                return (
                  <div
                    key={cat._id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "var(--dash-alt-bg)",
                      border: "1px solid var(--dash-border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: cat.color || CHART_COLORS[i % CHART_COLORS.length],
                        }} />
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--dash-foreground)" }}>
                          {cat.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11.5px", color: "var(--dash-muted)", fontWeight: 500 }}>
                          {cat.count} expenses
                        </span>
                        <span style={{ fontSize: "13.5px", fontWeight: 800, color: "var(--dash-blue)" }}>
                          {formatCurrency(cat.total, user?.currency)}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: "5px", background: "rgba(226, 232, 240, 0.8)", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--dash-blue)",
                          borderRadius: "999px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dash-empty-box" style={{ padding: "40px 16px" }}>
              <p className="dash-empty-title">No categories yet</p>
              <p className="dash-empty-desc">Your spending rankings will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 6-MONTH COMPARISON BAR CHART ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <h3 className="dash-card-title">6-Month Comparison</h3>
            <p className="dash-card-subtitle">Income vs expenses across recent months</p>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--dash-muted)", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--dash-emerald)" }} />
              Income
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--dash-muted)", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--dash-blue)" }} />
              Expenses
            </div>
          </div>
        </div>

        <div style={{ height: 280, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sixMonths} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--dash-font)" />
              <YAxis stroke="#94a3b8" fontSize={11} width={52} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactAxis(v, user?.currency || "USD")} fontFamily="var(--dash-font)" />
              <Tooltip content={<ChartTip cur={user?.currency} />} cursor={{ fill: "rgba(37, 99, 235, 0.04)" }} />
              <Bar dataKey="income" name="Income" fill="var(--dash-emerald)" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" name="Expense" fill="var(--dash-blue)" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── DAILY CASH FLOW AREA CHART ── */}
      {formattedDaily.length > 0 && (
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Daily Cash Flow</h3>
              <p className="dash-card-subtitle">
                Spending flow for {new Date(endDate).toLocaleString("default", { month: "long", year: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--dash-muted)", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--dash-emerald)" }} />
                Income
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--dash-muted)", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--dash-blue)" }} />
                Expenses
              </div>
            </div>
          </div>

          <div style={{ height: 260, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedDaily} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontFamily="var(--dash-font)" />
                <YAxis stroke="#94a3b8" fontSize={11} width={52} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactAxis(v, user?.currency || "USD")} fontFamily="var(--dash-font)" />
                <Tooltip content={<ChartTip cur={user?.currency} />} cursor={{ stroke: "rgba(37, 99, 235, 0.2)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2.5} fill="url(#dInc)" dot={false} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#2563eb" strokeWidth={2.5} fill="url(#dExp)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <AdSenseAd slot="reports" />
    </div>
  );
}
