import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Layers, BarChart2 } from "lucide-react";

// Premium Glassmorphism Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const incomeVal = payload.find((p) => p.dataKey === "income")?.value || 0;
    const expenseVal = payload.find((p) => p.dataKey === "expense")?.value || 0;
    const net = incomeVal - expenseVal;

    return (
      <div className="bg-brand-dark/90 backdrop-blur-2xl border border-white/15 rounded-xl p-3.5 shadow-2xl min-w-[160px] text-xs">
        <p className="font-semibold text-white mb-2 border-b border-white/10 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className={`text-2xs font-bold ${net >= 0 ? "text-brand-mint" : "text-brand-coral"}`}>
            {net >= 0 ? `+$${net.toFixed(0)}` : `-$${Math.abs(net).toFixed(0)}`}
          </span>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-brand-mint">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-mint" />
              Income:
            </span>
            <span className="font-semibold text-white">${incomeVal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-brand-coral">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-coral" />
              Expenses:
            </span>
            <span className="font-semibold text-white">${expenseVal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data = [] }) {
  const [chartType, setChartType] = useState("area"); // "area" | "bar"

  // Optimized data memoization for smooth rendering without re-renders
  const { chartData, totals } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      // Default fallback sample months if user has no data yet
      const fallback = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m) => ({
        month: m,
        income: 0,
        expense: 0,
      }));
      return {
        chartData: fallback,
        totals: { totalIncome: 0, totalExpense: 0, netAverage: 0 },
      };
    }

    let totInc = 0;
    let totExp = 0;

    const formatted = data.map((item) => {
      const inc = Number(item.income) || 0;
      const exp = Number(item.expense) || 0;
      totInc += inc;
      totExp += exp;
      return {
        month: item.month || "Mo",
        year: item.year || "",
        income: inc,
        expense: exp,
      };
    });

    return {
      chartData: formatted,
      totals: {
        totalIncome: totInc,
        totalExpense: totExp,
        netAverage: (totInc - totExp) / (formatted.length || 1),
      },
    };
  }, [data]);

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-300">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-primary text-brand-dark/10 text-brand-primary border border-brand-primary/20">
              <TrendingUp className="w-4 h-4" />
            </span>
            6-Month Financial Flow
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dynamic income vs. expense cadence across the last half year.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex p-0.5 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium transition-all cursor-pointer ${
                chartType === "area"
                  ? "bg-brand-primary text-brand-dark shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" /> Area
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium transition-all cursor-pointer ${
                chartType === "bar"
                  ? "bg-brand-primary text-brand-dark shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <BarChart2 className="w-3 h-3" /> Bars
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {/* Income Gradient */}
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                {/* Expense Gradient */}
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#ffffff10" }}
              />
              <YAxis
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#ffffff10" }}
              />
              <YAxis
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Indicators */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-mint" /> Income
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-coral" /> Expenses
          </span>
        </div>
        <div className="text-2xs text-zinc-400">
          6-Mo Inflow: <strong className="text-brand-mint font-semibold">${totals.totalIncome.toFixed(0)}</strong>
          {" "}| Outflow: <strong className="text-brand-coral font-semibold">${totals.totalExpense.toFixed(0)}</strong>
        </div>
      </div>
    </div>
  );
}
