import { useState, useEffect, useCallback, useRef } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Download, Calendar, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import api from "../api/axios";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const NOW = new Date();
const CURRENT_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;

const CHART_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#fff", borderColor: "#E4E5E6", borderWidth: 1,
      titleColor: "#29292E", bodyColor: "#6B6D75", padding: 10, cornerRadius: 8,
      displayColors: false,
      titleFont: { family: "Inter", size: 12, weight: "600" },
      bodyFont: { family: "Inter", size: 12 },
      callbacks: { label: ctx => fmt(ctx.raw) },
    },
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: "Inter", size: 11 }, color: "#9A9CA4" } },
    y: { grid: { color: "#F0F2F5" }, border: { display: false }, ticks: { font: { family: "Inter", size: 11 }, color: "#9A9CA4", callback: v => `$${v}` } },
  },
};

const DONUT_COLORS = ["#0118A3", "#3956BB", "#B5C9E0", "#B9A572", "#9A9CA4", "#6B6D75", "#E97B4F", "#4B9B6F"];

export default function ReportsPage() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [data, setData] = useState({ summary: null, byCategory: [], sixMonths: [], daily: [] });
  const reportRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, byCat, sixMonths, daily] = await Promise.all([
        api.get(`/reports/monthly-summary?month=${month}`),
        api.get(`/reports/by-category?month=${month}&type=expense`),
        api.get("/reports/six-months"),
        api.get(`/reports/daily?month=${month}`),
      ]);
      setData({
        summary: summary.data,
        byCategory: byCat.data.data || [],
        sixMonths: sixMonths.data.data || [],
        daily: daily.data.data || [],
      });
    } catch (err) {
      toast.error("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setExportLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`campuscoin-report-${month}.pdf`);
      toast.success("Report exported as PDF.");
    } catch (err) {
      toast.error("Export failed.");
    } finally {
      setExportLoading(false);
    }
  };

  // Charts data
  const sixBarData = {
    labels: data.sixMonths.map(d => d.month),
    datasets: [
      { label: "Income", data: data.sixMonths.map(d => d.income), backgroundColor: "#0118A3", borderRadius: 6, barPercentage: 0.5, categoryPercentage: 0.65 },
      { label: "Expense", data: data.sixMonths.map(d => d.expense), backgroundColor: "#B5C9E0", borderRadius: 6, barPercentage: 0.5, categoryPercentage: 0.65 },
    ],
  };

  const catDonutData = {
    labels: data.byCategory.slice(0, 7).map(c => c.name),
    datasets: [{
      data: data.byCategory.slice(0, 7).map(c => c.total),
      backgroundColor: DONUT_COLORS,
      borderWidth: 2, borderColor: "#FFFFFF", hoverOffset: 5,
    }],
  };

  // Build daily line chart
  const daysInMonth = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).getDate();
  const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  const incomeByDay = new Array(daysInMonth).fill(0);
  const expenseByDay = new Array(daysInMonth).fill(0);
  data.daily.forEach(d => {
    const idx = d._id.day - 1;
    if (d._id.type === "income") incomeByDay[idx] = d.total;
    else expenseByDay[idx] = d.total;
  });

  const dailyLineData = {
    labels: dailyLabels,
    datasets: [
      { label: "Expense", data: expenseByDay, borderColor: "#DC2626", borderWidth: 1.5, backgroundColor: "rgba(220,38,38,0.05)", fill: true, tension: 0.4, pointRadius: 0 },
      { label: "Income", data: incomeByDay, borderColor: "#0118A3", borderWidth: 1.5, backgroundColor: "rgba(1,24,163,0.05)", fill: true, tension: 0.4, pointRadius: 0 },
    ],
  };

  const { summary } = data;

  return (
    <div className="page-content">
      <PageHeader
        title="Reports"
        subtitle="Analyze your spending patterns and financial trends."
        actions={
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={15} style={{ color: "var(--color-subtle)" }} />
              <input
                type="month"
                className="cc-input"
                value={month}
                onChange={e => setMonth(e.target.value)}
                style={{ width: 160, height: 38 }}
              />
            </div>
            <button className="cc-btn-secondary" onClick={exportPDF} disabled={exportLoading}>
              {exportLoading ? <Spinner size={15} /> : <Download size={15} />}
              Export PDF
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div className="cc-tab-bar" style={{ marginBottom: 20 }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "categories", label: "By Category" },
          { id: "trends", label: "6-Month Trends" },
          { id: "daily", label: "Daily Summary" },
        ].map(t => (
          <button key={t.id} className={`cc-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size={28} /></div>
      ) : (
        <div ref={reportRef}>
          {/* Overview Tab */}
          {tab === "overview" && (
            <div>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "Total Income", value: fmt(summary?.income), color: "var(--color-success)", icon: <TrendingUp size={18} /> },
                  { label: "Total Expenses", value: fmt(summary?.expense), color: "var(--color-danger)", icon: <TrendingDown size={18} /> },
                  { label: "Net Balance", value: fmt(summary?.balance), color: summary?.balance >= 0 ? "var(--color-brand)" : "var(--color-danger)", icon: <PieChart size={18} /> },
                ].map((s, i) => (
                  <div key={i} className="cc-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div className="icon-box" style={{ width: 44, height: 44, background: `${s.color}14`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--color-subtle)", fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Donut + bar side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
                <div className="cc-card">
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</div>
                  {data.byCategory.length === 0 ? (
                    <EmptyState icon={<PieChart size={22} />} title="No expenses this month" />
                  ) : (
                    <div>
                      <div style={{ height: 180 }}>
                        <Doughnut data={catDonutData} options={{ ...CHART_BASE, cutout: "65%", plugins: { ...CHART_BASE.plugins } }} />
                      </div>
                      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 7 }}>
                        {data.byCategory.slice(0, 5).map((c, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: DONUT_COLORS[i], flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 12, color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{fmt(c.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="cc-card">
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Daily Spending</div>
                  <div style={{ height: 240 }}>
                    <Line data={dailyLineData} options={CHART_BASE} />
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                    {[{ color: "#0118A3", label: "Income" }, { color: "#DC2626", label: "Expense" }].map(l => (
                      <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-muted)" }}>
                        <span style={{ width: 12, height: 3, borderRadius: 2, background: l.color, display: "inline-block" }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {tab === "categories" && (
            <div className="cc-card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Spending by Category — {month}</div>
              {data.byCategory.length === 0 ? (
                <EmptyState icon={<PieChart size={24} />} title="No expense data" description="Add some expenses this month." />
              ) : (
                <div>
                  <div style={{ height: 260, marginBottom: 20 }}>
                    <Bar
                      data={{
                        labels: data.byCategory.map(c => c.name),
                        datasets: [{
                          data: data.byCategory.map(c => c.total),
                          backgroundColor: DONUT_COLORS,
                          borderRadius: 7,
                          barPercentage: 0.6,
                        }],
                      }}
                      options={{ ...CHART_BASE, plugins: { ...CHART_BASE.plugins, legend: { display: false } } }}
                    />
                  </div>
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Transactions</th>
                        <th style={{ textAlign: "right" }}>Amount</th>
                        <th style={{ textAlign: "right" }}>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCategory.map((c, i) => {
                        const totalExp = data.byCategory.reduce((s, x) => s + x.total, 0);
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                                {c.name}
                              </div>
                            </td>
                            <td style={{ color: "var(--color-muted)" }}>{c.count}</td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(c.total)}</td>
                            <td style={{ textAlign: "right", color: "var(--color-muted)" }}>
                              {totalExp > 0 ? ((c.total / totalExp) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {tab === "trends" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="cc-card">
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Income vs Expenses — Last 6 Months</div>
                {data.sixMonths.length === 0 ? (
                  <EmptyState icon={<TrendingUp size={24} />} title="No data available" />
                ) : (
                  <div style={{ height: 280 }}>
                    <Bar data={sixBarData} options={{
                      ...CHART_BASE,
                      plugins: {
                        ...CHART_BASE.plugins,
                        legend: {
                          display: true,
                          position: "top",
                          align: "end",
                          labels: { usePointStyle: true, pointStyle: "rectRounded", font: { family: "Inter", size: 11 }, color: "#6B6D75", boxWidth: 12, padding: 16 },
                        },
                      },
                    }} />
                  </div>
                )}
              </div>
              <div className="cc-card">
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Net Balance Trend</div>
                <div style={{ height: 180 }}>
                  <Line
                    data={{
                      labels: data.sixMonths.map(d => d.month),
                      datasets: [{
                        label: "Balance",
                        data: data.sixMonths.map(d => d.income - d.expense),
                        borderColor: "#0118A3", borderWidth: 2,
                        backgroundColor: "rgba(1,24,163,0.06)", fill: true,
                        tension: 0.4, pointBackgroundColor: "#0118A3", pointRadius: 3,
                      }],
                    }}
                    options={CHART_BASE}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Daily Tab */}
          {tab === "daily" && (
            <div className="cc-card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Daily Spending — {month}</div>
              <div style={{ height: 280, marginBottom: 16 }}>
                <Line data={dailyLineData} options={CHART_BASE} />
              </div>
              {/* Daily table */}
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th style={{ textAlign: "right" }}>Income</th>
                    <th style={{ textAlign: "right" }}>Expense</th>
                    <th style={{ textAlign: "right" }}>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLabels.map((day, i) => {
                    const inc = incomeByDay[i];
                    const exp = expenseByDay[i];
                    if (inc === 0 && exp === 0) return null;
                    return (
                      <tr key={day}>
                        <td>{month}-{String(day).padStart(2, "0")}</td>
                        <td style={{ textAlign: "right", color: "var(--color-success)", fontWeight: 500 }}>{inc > 0 ? fmt(inc) : "—"}</td>
                        <td style={{ textAlign: "right", color: "var(--color-danger)", fontWeight: 500 }}>{exp > 0 ? fmt(exp) : "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: inc - exp >= 0 ? "var(--color-brand)" : "var(--color-danger)" }}>{fmt(inc - exp)}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
