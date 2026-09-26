import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useOutletContext, Navigate } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import {
  Sparkles, Wallet, ArrowUpRight, ArrowDownRight, Target,
  Calendar, FileText, Coins, PieChart,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getDashboardMetrics, getRecentTransactions } from "../transactions/transactionApi";
import { getBudgets } from "../budgets/budgetApi";
import { getSubscriptions } from "../subscriptions/subscriptionApi";
import TransactionModal from "../transactions/TransactionModal";
import TransactionDetailModal from "../../components/ui/TransactionDetailModal";
import CategoryIcon from "../../components/ui/CategoryIcon";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import NumberTicker from "../../components/ui/NumberTicker";
import { formatCurrency } from "../../utils/currencyUtils";

// Recharts
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

// Video-Accurate Physical Spatial Glass Standard Recipe
const glassCard =
  "base-glass glass-card rounded-3xl bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white transform-gpu backface-hidden";

// Liquid Glass Tooltip for Charts
const CustomTooltip = ({ active, payload, label, currencyCode = "USD" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[20px] bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-[64px] backdrop-saturate-[200%] border border-white/20 border-b-white/5 border-r-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_0_rgba(0,0,0,0.15)] p-3.5 min-w-[140px] text-xs text-white">
        <p className="font-bold text-white mb-2 border-b border-white/15 pb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3 mb-1">
            <span style={{ color: p.color || "#FFFFFF" }} className="font-medium drop-shadow-sm">{p.name}:</span>
            <span className="font-black text-white">{formatCurrency(p.value, currencyCode)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Resilient Fallback Data for 0ms initial load
const defaultDashboard = {
  metrics: {
    currentMonth: { income: 0, expense: 0 },
    trends: [
      { month: "May", income: 0, expense: 0, net: 0 },
      { month: "Jun", income: 0, expense: 0, net: 0 },
      { month: "Jul", income: 0, expense: 0, net: 0 },
      { month: "Aug", income: 0, expense: 0, net: 0 },
      { month: "Sep", income: 0, expense: 0, net: 0 },
      { month: "Oct", income: 0, expense: 0, net: 0 },
    ],
  },
  recentTx: [],
  budgets: [],
  subscriptions: [],
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const outletCtx = useOutletContext();
  const queryClient = useQueryClient();
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const openAdd = outletCtx?.openQuickAdd || (() => setQuickAddOpen(true));

  // Query Hook: Opens in 0ms and syncs live in background
  const { data: dashboardData, isLoading: queryLoading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      try {
        const results = await Promise.allSettled([
          getDashboardMetrics(),
          getRecentTransactions(),
          getBudgets(),
          getSubscriptions(),
        ]);

        const [metricsRes, recentRes, budgetsRes, subsRes] = results;

        return {
          metrics: metricsRes.status === "fulfilled" && metricsRes.value?.success ? metricsRes.value : defaultDashboard.metrics,
          recentTx: recentRes.status === "fulfilled" && recentRes.value?.success ? (recentRes.value.transactions || []) : defaultDashboard.recentTx,
          budgets: budgetsRes.status === "fulfilled" && budgetsRes.value?.success ? (budgetsRes.value.budgets || []) : defaultDashboard.budgets,
          subscriptions: subsRes.status === "fulfilled" && subsRes.value?.success ? (subsRes.value.subscriptions || []) : defaultDashboard.subscriptions,
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

  // GSAP Entrance Animation: Staggered reveal (disabled/lightweight on mobile for 60fps scrolling)
  useEffect(() => {
    let ctx;
    const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobileDevice) {
      // Keep mobile scrolling at 60fps without heavy animation overhead
      return;
    }

    const rafId = requestAnimationFrame(() => {
      if (containerRef.current) {
        ctx = gsap.context(() => {
          gsap.fromTo(
            ".glass-card",
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out",
              clearProps: "all",
            }
          );

          if (chartRef.current) {
            gsap.fromTo(
              chartRef.current,
              { scaleY: 0.85, opacity: 0, transformOrigin: "bottom center" },
              { scaleY: 1, opacity: 1, duration: 0.7, delay: 0.2, ease: "power3.out", clearProps: "all" }
            );
          }
        }, containerRef);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (ctx) ctx.revert();
    };
  }, []);

  // Strict Auth Gate: Do not render until authentication is definitively resolved
  if (!isAuthenticated && !isAuthLoading) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  if (queryLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  const { metrics, recentTx, budgets } = dashboardData || defaultDashboard;

  const totalIncome = metrics?.currentMonth?.income || 0;
  const totalExpense = metrics?.currentMonth?.expense || 0;
  const totalBalance = totalIncome - totalExpense;

  const availableBudget =
    (budgets || []).reduce((acc, b) => acc + (b.limitAmount - (b.spentAmount || 0)), 0) || 0;
  const balanceChange = totalBalance >= 0 ? "+0.0%" : "-0.0%";
  const expenseChange = "-0.0%";

  // Memoized Chart Data
  const chartData = useMemo(() => {
    const raw = metrics?.trends || [];
    if (raw.length === 0) return defaultDashboard.metrics.trends;
    return raw.map((d) => ({
      month: d.month || "Mo",
      income: Number(d.income) || 0,
      expense: Number(d.expense) || 0,
      net: (Number(d.income) || 0) - (Number(d.expense) || 0),
    }));
  }, [metrics?.trends]);

  const displayTx = useMemo(() => {
    return (recentTx || []).slice(0, 6);
  }, [recentTx]);

  return (
    <div ref={containerRef} className="space-y-6 w-full text-white">
      {/* ─── Top Row (Metrics): Exactly 4 Uniform Summary Cards Side-by-Side ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Balance */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Total Balance</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-sky-300 shadow-inner">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={totalBalance} currencyCode={user?.currency || "USD"} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {balanceChange} Net Status
            </div>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Total Income</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-emerald-300 shadow-inner">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={totalIncome} currencyCode={user?.currency || "USD"} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <Coins className="w-3.5 h-3.5 text-emerald-300" /> Monthly Inflow
            </div>
          </div>
        </div>

        {/* Card 3: Total Expense */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Total Expense</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-rose-300 shadow-inner">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={totalExpense} currencyCode={user?.currency || "USD"} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-300" /> {expenseChange} vs last month
            </div>
          </div>
        </div>

        {/* Card 4: Active Budgets */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Active Budgets</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-emerald-300 shadow-inner">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={availableBudget} currencyCode={user?.currency || "USD"} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <Target className="w-3.5 h-3.5 text-emerald-300" /> {budgets?.length || 0} Categories capped
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Row (Split View): Wide Analytical Chart (Left ~67%) & Vertical List (Right ~33%) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Bottom Left: Wide Analytical Chart (Income vs. Expense) - 60-70% width */}
        <div ref={chartRef} className={`lg:col-span-8 ${glassCard} p-6 sm:p-7 flex flex-col justify-between min-h-[440px]`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5 drop-shadow-sm">
                <div className="p-1.5 rounded-full bg-white/20">
                  <Sparkles className="w-4 h-4 text-sky-300" />
                </div>
                Income vs. Expense Analytics
              </h3>
              <p className="text-xs text-white/60 mt-1">Cash flow velocity and monthly performance trend</p>
            </div>
            <div className="bg-white/15 border border-white/25 rounded-full px-3.5 py-1.5 text-xs text-white font-medium flex items-center gap-2 w-fit">
              <Calendar className="w-3.5 h-3.5 text-white/80" /> Past 6 Months
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, user?.currency || "USD")} />
                <Tooltip content={<CustomTooltip currencyCode={user?.currency || "USD"} />} cursor={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                <Line type="monotone" dataKey="income" name="Total Income" stroke="#10B981" strokeWidth={3.5} dot={{ r: 4, fill: "#10B981", strokeWidth: 0 }} activeDot={{ r: 7, stroke: "#FFFFFF", strokeWidth: 3 }} />
                <Line type="monotone" dataKey="expense" name="Total Expense" stroke="#EF4444" strokeWidth={3.5} dot={{ r: 4, fill: "#EF4444", strokeWidth: 0 }} activeDot={{ r: 7, stroke: "#FFFFFF", strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10 text-xs font-semibold text-white/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span>Total Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span>Total Expense</span>
            </div>
          </div>
        </div>

        {/* Bottom Right: Vertical List Component (Recent Transactions) - 30-40% width */}
        <div className={`lg:col-span-4 ${glassCard} p-6 sm:p-7 flex flex-col justify-between min-h-[440px]`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5 drop-shadow-sm">
                <div className="p-1.5 rounded-full bg-white/20">
                  <FileText className="w-4 h-4 text-white/80" />
                </div>
                Recent Transactions
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/80">
                {recentTx?.length || 0} logged
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {displayTx.length > 0 ? (
                displayTx.map((tx) => (
                  <div
                    key={tx._id}
                    onClick={() => setSelectedTx(tx)}
                    className="flex items-center justify-between p-3 rounded-[20px] bg-white/5 hover:bg-white/15 border border-white/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <CategoryIcon categoryName={tx.categoryId?.name} className="w-4 h-4" useEmerald={tx.type === "income"} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                          {tx.description || "Transaction"}
                        </p>
                        <p className="text-[10px] text-white/60 font-medium">
                          {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {tx.categoryId?.name || "General"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className={`font-black text-sm drop-shadow-sm ${tx.type === "income" ? "text-emerald-300" : "text-white"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, user?.currency || "USD")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-14 text-center text-white/60 text-xs">
                  No transactions recorded yet.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/app/transactions"
            className="mt-6 w-full py-2.5 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 text-white font-bold text-xs text-center block shadow-sm min-h-[44px] flex items-center justify-center transition-colors"
          >
            View All Transactions
          </Link>
        </div>
      </div>

      {/* Physical Glass Transaction Detail Receipt Modal */}
      {selectedTx && (
        <TransactionDetailModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {/* Global Quick Add Transaction Modal */}
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
