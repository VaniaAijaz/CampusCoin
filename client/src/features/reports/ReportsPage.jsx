import { useState, useEffect, useCallback, useMemo } from "react";
import MonthPicker from "../../components/ui/MonthPicker";
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  PieChart as PieIcon,
  TrendingUp,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  getMonthlySummary,
  getReportByCategory,
  getSixMonthsTrends,
  getDailyReport,
  getTopCategory,
} from "./reportsApi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

const COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#F43F5E",
  "#8B5CF6", "#06B6D4", "#EC4899", "#64748B",
];

import { generateStatementPDF } from "./StatementGenerator";
import { useAuth } from "../auth/AuthContext";

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [sixMonths, setSixMonths] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [topCat, setTopCat] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, sixRes, dailyRes, topRes] = await Promise.all([
        getMonthlySummary(selectedMonth),
        getReportByCategory(selectedMonth, "expense"),
        getSixMonthsTrends(),
        getDailyReport(selectedMonth),
        getTopCategory(),
      ]);

      if (sumRes.success) setSummary(sumRes);
      if (catRes.success) setCategoryData(catRes.data);
      if (sixRes.success) setSixMonths(sixRes.data);
      if (dailyRes.success) setDailyData(dailyRes.data);
      if (topRes.success) setTopCat(topRes.topCategory);
    } catch {
      toast.error("Failed to load analytics reports.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Memoized daily chart data
  const formattedDaily = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];
    const daysMap = {};
    dailyData.forEach((item) => {
      const day = item._id?.day;
      const type = item._id?.type;
      if (!daysMap[day]) daysMap[day] = { day: `Day ${day}`, income: 0, expense: 0 };
      if (type === "income") daysMap[day].income = item.total;
      else if (type === "expense") daysMap[day].expense = item.total;
    });
    return Object.values(daysMap);
  }, [dailyData]);

  const pieData = useMemo(() => {
    return categoryData.map((cat, i) => ({
      ...cat,
      fill: cat.color || COLORS[i % COLORS.length]
    }));
  }, [categoryData]);

  const handleDownloadPDF = () => {
    generateStatementPDF(user);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-primary" />
            Financial Analytics & Reports
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            In-depth categorized breakdown, multi-month trajectories, and exportable student summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          <button
            onClick={handleDownloadPDF}
            className="py-2 px-4 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Monthly Statement</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-zinc-400 font-medium">Monthly Inflow</span>
            <div className="p-1.5 rounded-lg bg-brand-mint/10 text-brand-mint">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ${summary?.income ? summary.income.toFixed(2) : "0.00"}
          </div>
          <p className="text-3xs text-zinc-400 mt-1">Stipends, part-time & allowances</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-zinc-400 font-medium">Monthly Outflow</span>
            <div className="p-1.5 rounded-lg bg-brand-coral/10 text-brand-coral">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            ${summary?.expense ? summary.expense.toFixed(2) : "0.00"}
          </div>
          <p className="text-3xs text-zinc-400 mt-1">All categorised campus spending</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-zinc-400 font-medium">Net Monthly Margin</span>
            <span
              className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${
                (summary?.balance || 0) >= 0
                  ? "bg-brand-mint/10 text-brand-mint border-brand-mint/20"
                  : "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
              }`}
            >
              {(summary?.balance || 0) >= 0 ? "Surplus" : "Deficit"}
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {(summary?.balance || 0) >= 0 ? "+" : ""}$
            {summary?.balance ? summary.balance.toFixed(2) : "0.00"}
          </div>
          <p className="text-3xs text-zinc-400 mt-1">Preserved capital toward savings</p>
        </div>
      </div>

      {/* Grid: Category Spend Distribution & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut / Bar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
            <PieIcon className="w-4 h-4 text-brand-primary" />
            Spending Distribution by Category
          </h3>

          {categoryData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`$${Number(val).toFixed(2)}`, "Spent"]}
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#ffffff20",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                {categoryData.map((cat, i) => (
                  <div key={cat._id} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }}
                    />
                    <span className="text-zinc-300 truncate">{cat.name}:</span>
                    <span className="font-semibold text-white">${cat.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-zinc-400">
              No expense records found for {selectedMonth}.
            </div>
          )}
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
            <Tag className="w-4 h-4 text-brand-primary" />
            Category Ranking & Frequency
          </h3>

          {categoryData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 uppercase text-3xs font-semibold">
                    <th className="pb-3 pl-2">Category</th>
                    <th className="pb-3 text-center">Transactions</th>
                    <th className="pb-3 text-right pr-2">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {categoryData.map((cat, i) => (
                    <tr key={cat._id} className="hover:bg-white/[0.02]">
                      <td className="py-3 pl-2 flex items-center gap-2 font-medium text-white">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }}
                        />
                        {cat.name}
                      </td>
                      <td className="py-3 text-center text-zinc-400">{cat.count} txs</td>
                      <td className="py-3 text-right pr-2 font-bold text-white">
                        ${cat.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-zinc-400">
              No category data available for this month.
            </div>
          )}
        </div>
      </div>

      {/* Multi-Month Historical Cadence */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          6-Month Trajectory Comparison
        </h3>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sixMonths} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="month" stroke="#71717A" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#ffffff20",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
