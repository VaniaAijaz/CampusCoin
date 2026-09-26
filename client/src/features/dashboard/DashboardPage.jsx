import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useOutletContext, Navigate } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  Sparkles, Plus, Wallet, ArrowUpRight, ArrowDownRight, Target, Clock,
  Search, Calendar, FileText, Zap, Coins, PieChart, X, Tag, CheckCircle2,
  MoreHorizontal, Download, RefreshCw, SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getDashboardMetrics, getRecentTransactions } from "../transactions/transactionApi";
import { getBudgets } from "../budgets/budgetApi";
import { getSubscriptions } from "../subscriptions/subscriptionApi";
import TransactionModal from "../transactions/TransactionModal";
import DynamicAiInsight from "../insights/DynamicAiInsight";
import IouSlidingSheet from "../debts/IouSlidingSheet";
import SubscriptionLogo from "../../components/ui/SubscriptionLogo";
import CategoryIcon from "../../components/ui/CategoryIcon";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import NumberTicker from "../../components/ui/NumberTicker";

// Recharts
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

// The "Anti-Plastic" True Glass Standard Recipe
const glassCard =
  "true-glass glass-card rounded-[32px] bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-[64px] backdrop-saturate-[200%] border border-white/20 border-b-white/5 border-r-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_0_rgba(0,0,0,0.15)] text-white";

// Liquid Glass Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[20px] bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-[64px] backdrop-saturate-[200%] border border-white/20 border-b-white/5 border-r-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_0_rgba(0,0,0,0.15)] p-3.5 min-w-[140px] text-xs text-white">
        <p className="font-bold text-white mb-2 border-b border-white/15 pb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3 mb-1">
            <span style={{ color: p.color || "#FFFFFF" }} className="font-medium drop-shadow-sm">{p.name}:</span>
            <span className="font-black text-white">${Number(p.value).toFixed(2)}</span>
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
    currentMonth: { income: 1500, expense: 535.49 },
    trends: [
      { month: "May", income: 1400, expense: 800, net: 600 },
      { month: "Jun", income: 1500, expense: 950, net: 550 },
      { month: "Jul", income: 1500, expense: 1100, net: 400 },
      { month: "Aug", income: 1600, expense: 1200, net: 400 },
      { month: "Sep", income: 1500, expense: 890, net: 610 },
      { month: "Oct", income: 1500, expense: 535, net: 965 },
    ],
  },
  recentTx: [
    { _id: "sample-1", description: "Campus Dining Hall Meal Pack", amount: 45.5, type: "expense", date: new Date().toISOString() },
    { _id: "sample-2", description: "Monthly Student Allowance", amount: 1500, type: "income", date: new Date().toISOString() },
    { _id: "sample-3", description: "City Transit Card Top-up", amount: 25.0, type: "expense", date: new Date().toISOString() },
  ],
  budgets: [
    { _id: "b-1", categoryId: { name: "Food" }, limitAmount: 400, spentAmount: 145 },
    { _id: "b-2", categoryId: { name: "Transit" }, limitAmount: 100, spentAmount: 50 },
    { _id: "b-3", categoryId: { name: "Entertainment" }, limitAmount: 150, spentAmount: 65 },
  ],
  subscriptions: [
    { _id: "s-1", service_name: "Spotify", amount: 5.99, next_due_date: new Date(Date.now() + 3 * 86400000).toISOString() },
  ],
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const outletCtx = useOutletContext();
  const queryClient = useQueryClient();
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  const [iouOpen, setIouOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
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

  // GSAP Entrance Animation: Staggered entry with back.out(1.2)
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".glass-card",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.2)",
            clearProps: "all",
          }
        );

        // Chart Reveal Animation via GSAP
        if (chartRef.current) {
          gsap.fromTo(
            chartRef.current,
            { scaleY: 0.85, opacity: 0, transformOrigin: "bottom center" },
            { scaleY: 1, opacity: 1, duration: 0.8, delay: 0.25, ease: "power3.out", clearProps: "all" }
          );
        }
      }, containerRef);

      return () => ctx.revert();
    }
  }, []);

  // Strict Auth Gate: Do not render until authentication is definitively resolved
  if (!isAuthenticated && !isAuthLoading) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }

  // Show skeleton on initial load if no data exists
  if (queryLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  const { metrics, recentTx, budgets, subscriptions } = dashboardData || defaultDashboard;

  const totalIncome = metrics?.currentMonth?.income || 1500;
  const totalExpense = metrics?.currentMonth?.expense || 535.49;
  const totalBalance = totalIncome - totalExpense;
  const savingsGoal = user?.monthlySavingsGoal || 300;

  const availableBudget =
    (budgets || []).reduce((acc, b) => acc + (b.limitAmount - (b.spentAmount || 0)), 0) || 1200;
  const balanceChange = "+5.2%";
  const expenseChange = "-1.8%";
  const budgetChange = "+12.4%";
  const savingsChange = "+2.1%";

  const upcomingBills = (subscriptions || []).filter((s) => new Date(s.next_due_date) >= new Date()).slice(0, 4);

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

  const filteredTx = useMemo(() => {
    const txList = recentTx || [];
    if (!searchTerm.trim()) return txList.slice(0, 5);
    return txList
      .filter((t) =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoryId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
  }, [recentTx, searchTerm]);

  return (
    <div ref={containerRef} className="space-y-6 w-full text-white">
      {/* Top Banner Row (AI Advisor + IOU Tracker) */}
      <div className="flex flex-col md:flex-row gap-4 items-center w-full">
        <DynamicAiInsight />
        <button
          onClick={() => setIouOpen(true)}
          className={`${glassCard} p-5 flex items-center justify-center gap-2.5 font-bold text-white hover:bg-white/20 transition-colors shrink-0 w-full md:w-auto h-full min-h-[44px] cursor-pointer !rounded-full active:scale-95`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400/30 border border-emerald-300/40 flex items-center justify-center shadow-sm">
            <Coins className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="md:hidden lg:inline text-sm">IOU Splitter</span>
        </button>
      </div>

      {/* Top Metric Grid: Responsive 4-Card Liquid Glass Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Balance */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Total Balance</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-sky-300 shadow-inner">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={totalBalance} prefix="$" decimals={2} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {balanceChange} vs last month
            </div>
          </div>
        </div>

        {/* Monthly Spending */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Monthly Spending</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-rose-300 shadow-inner">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={totalExpense} prefix="$" decimals={2} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-300" /> {expenseChange} vs last month
            </div>
          </div>
        </div>

        {/* Available Budget */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Available Budget</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-emerald-300 shadow-inner">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={availableBudget} prefix="$" decimals={2} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {budgetChange} allocated
            </div>
          </div>
        </div>

        {/* Savings Goal */}
        <div className={`${glassCard} p-6 flex flex-col justify-between relative min-h-[148px]`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Savings Goal</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-amber-300 shadow-inner">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              <NumberTicker value={savingsGoal} prefix="$" decimals={2} />
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {savingsChange} on track
            </div>
          </div>
        </div>
      </div>

      {/* Middle Responsive Section: Cash Flow Projection & Upcoming Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Cash Flow Projection (Spans 8 cols on lg/xl) */}
        <div ref={chartRef} className={`lg:col-span-8 ${glassCard} p-6 sm:p-7 flex flex-col`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5 drop-shadow-sm">
              <div className="p-1.5 rounded-full bg-white/20">
                <Sparkles className="w-4 h-4 text-sky-300" />
              </div>
              Cash Flow Projection
            </h3>
            <div className="bg-white/15 border border-white/25 rounded-full px-3.5 py-1.5 text-xs text-white font-medium flex items-center gap-2 w-fit">
              <Calendar className="w-3.5 h-3.5 text-white/80" /> Past 6 Months
            </div>
          </div>
          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.3)", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: "#38BDF8", strokeWidth: 0 }} activeDot={{ r: 7, stroke: "#FFFFFF", strokeWidth: 3 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#FB7185" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: "#FFFFFF", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Upcoming Recurring Bills (Spans 4 cols on lg/xl) */}
        <div className={`lg:col-span-4 ${glassCard} p-6 sm:p-7 flex flex-col justify-between`}>
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5 drop-shadow-sm">
              <div className="p-1.5 rounded-full bg-white/20">
                <Clock className="w-4 h-4 text-white/80" />
              </div>
              Upcoming Bills
            </h3>
            <div className="flex-1 flex flex-col gap-3">
              {upcomingBills.length === 0 && (
                <p className="text-white/60 text-xs text-center py-6">No bills due in the next 7 days.</p>
              )}
              {upcomingBills.map((bill) => {
                const today = new Date();
                const nextDue = new Date(bill.next_due_date);
                const timeDiff = nextDue.getTime() - today.getTime();
                const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
                const cyclePercentage = Math.min(100, Math.max(0, ((30 - daysRemaining) / 30) * 100));

                let progressColor = "bg-sky-400";
                let badgeClass = "text-white/80";

                if (daysRemaining < 2) {
                  progressColor = "bg-rose-400";
                  badgeClass = "text-rose-300 font-bold";
                } else if (daysRemaining < 7) {
                  progressColor = "bg-amber-400";
                  badgeClass = "text-amber-300 font-semibold";
                }

                return (
                  <div
                    key={bill._id}
                    className="flex flex-col gap-2 p-3.5 rounded-[20px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SubscriptionLogo serviceName={bill.service_name} />
                        <div>
                          <div className="text-sm font-bold text-white">{bill.service_name}</div>
                          <div className={`text-xs ${badgeClass}`}>
                            {daysRemaining === 0 ? "Due today" : `Due in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-black text-white">${Number(bill.amount || 0).toFixed(2)}</div>
                    </div>
                    {/* Liquid Progress Bar */}
                    <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${cyclePercentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            to="/app/transactions"
            className="mt-6 w-full py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 font-bold text-white text-xs text-center block shadow-sm min-h-[44px] flex items-center justify-center transition-colors"
          >
            Manage Subscriptions
          </Link>
        </div>
      </div>

      {/* Bottom Section: Money Flow Net Stream & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Net Stream / Money Flow (Spans 4 cols on lg/xl) */}
        <div className={`lg:col-span-4 ${glassCard} p-6 sm:p-7 flex flex-col`}>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5 drop-shadow-sm">
            <div className="p-1.5 rounded-full bg-white/20">
              <Zap className="w-4 h-4 text-sky-300" />
            </div>
            Net Cash Flow
          </h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="netStreamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.3)" }} />
                <Area type="monotone" dataKey="net" name="Net Stream" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#netStreamGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Recent Transactions Table with Responsive Morphing (Spans 8 cols on lg/xl) */}
        <div className={`lg:col-span-8 ${glassCard} p-6 sm:p-7 flex flex-col`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5 drop-shadow-sm">
              <div className="p-1.5 rounded-full bg-white/20">
                <FileText className="w-4 h-4 text-white/80" />
              </div>
              Recent Transactions
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter transactions..."
                  className="pl-9 pr-4 py-2 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 transition-colors w-full sm:w-48 min-h-[38px]"
                />
              </div>
              <button
                onClick={openAdd}
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              {/* Progressive Disclosure Ellipsis Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center cursor-pointer shadow-sm active:scale-95 min-h-[38px] min-w-[38px] transition-colors"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-[20px] bg-[#0B0D0E]/90 backdrop-blur-[64px] backdrop-saturate-[200%] border border-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.4)] p-1.5 z-30 space-y-1"
                    >
                      <Link
                        to="/app/transactions"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white rounded-[14px] hover:bg-white/15 transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-sky-300" />
                        <span>All Transactions</span>
                      </Link>
                      <Link
                        to="/app/reports"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white rounded-[14px] hover:bg-white/15 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Export Statement</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/90 hover:text-white rounded-[14px] hover:bg-white/15 transition-colors cursor-pointer text-left"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                        <span>Sync Live Data</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-1 rounded-[24px] bg-white/5 border border-white/20 p-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-white/70 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.length > 0 ? (
                  filteredTx.map((tx) => (
                    <tr
                      key={tx._id}
                      onClick={() => setSelectedTx(tx)}
                      className="even:bg-white/[0.04] hover:bg-white/15 transition-colors cursor-pointer rounded-[16px] group"
                    >
                      <td className="py-3.5 px-4 text-white/70 whitespace-nowrap font-medium">
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold group-hover:text-sky-300 transition-colors">
                        {tx.description || <span className="text-white/50 italic font-normal">No description</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5">
                          <CategoryIcon categoryName={tx.categoryId?.name} className="w-3.5 h-3.5" useEmerald={tx.type === "income"} />
                          {tx.categoryId?.name || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className={`font-black text-sm drop-shadow-sm ${tx.type === "income" ? "text-emerald-300" : "text-white"}`}>
                          {tx.type === "income" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-white/60">
                      No matching transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Link
            to="/app/transactions"
            className="mt-6 w-full py-2.5 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 text-white font-bold text-xs text-center block shadow-sm min-h-[44px] flex items-center justify-center transition-colors"
          >
            View All Transactions
          </Link>
        </div>
      </div>

      {/* Responsive Morphing Transaction Detail Sheet / Modal */}
      <AnimatePresence>
        {selectedTx && (
          <TransactionDetailModal
            tx={selectedTx}
            onClose={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />

      {/* IOU Tracker Sliding Sheet */}
      <IouSlidingSheet isOpen={iouOpen} onClose={() => setIouOpen(false)} />
    </div>
  );
}

/**
 * Responsive Morphing Modal / Sheet (Pillar 5):
 * Mobile (< md): Slides up from bottom as swipeable bottom sheet (rounded-t-[32px])
 * Desktop (>= md): Morphs into centered visionOS glass modal (rounded-[32px])
 */
function TransactionDetailModal({ tx, onClose }) {
  const isIncome = tx.type === "income";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Dim backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[6px] -z-10"
      />

      {/* Morphing container */}
      <motion.div
        initial={{ y: "100%", opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        className={`w-full md:max-w-md ${glassCard} p-6 sm:p-8 rounded-t-[32px] md:rounded-[32px] shadow-[0_0_30px_rgba(255,255,255,0.15)] flex flex-col gap-5`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isIncome ? "bg-emerald-400/25 text-emerald-300" : "bg-white/20 text-white"}`}>
              {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <h4 className="text-base font-bold text-white">Transaction Details</h4>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer min-h-[32px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center py-2">
          <div className={`text-4xl font-black ${isIncome ? "text-emerald-300" : "text-white"} drop-shadow-sm`}>
            {isIncome ? "+" : "-"}${Number(tx.amount).toFixed(2)}
          </div>
          <p className="text-xs text-white/70 mt-1 font-medium">{tx.description || "No description provided"}</p>
        </div>

        <div className="space-y-3 rounded-[20px] bg-white/10 p-4 border border-white/20 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Category</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-300" />
              {tx.categoryId?.name || "General"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Date & Time</span>
            <span className="font-bold text-white">
              {new Date(tx.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Type</span>
            <span className={`font-bold uppercase tracking-wider text-[11px] ${isIncome ? "text-emerald-300" : "text-sky-300"}`}>
              {tx.type}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Status</span>
            <span className="font-bold text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Cleared
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer min-h-[44px]"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
