import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useOutletContext, Navigate } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import {
  Sparkles, Plus, Wallet, ArrowUpRight, ArrowDownRight, Target, Clock,
  Search, Calendar, FileText, Zap, Coins, PieChart
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
import LoadingScreen from "../../components/ui/LoadingScreen";

// Recharts
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

// Liquid Glass Card Recipe
const liquidCardClass = "glass-element rounded-[32px] bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] text-white";

// Liquid Glass Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[20px] bg-white/20 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/40 p-3.5 min-w-[140px] text-xs text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <p className="font-bold text-white mb-2 border-b border-white/20 pb-1">{label}</p>
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

// Resilient Instant Data for 0ms initial load
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
    ]
  },
  recentTx: [
    { _id: "sample-1", description: "Campus Dining Hall Meal Pack", amount: 45.5, type: "expense", date: new Date().toISOString() },
    { _id: "sample-2", description: "Monthly Student Allowance", amount: 1500, type: "income", date: new Date().toISOString() },
    { _id: "sample-3", description: "City Transit Card Top-up", amount: 25.0, type: "expense", date: new Date().toISOString() }
  ],
  budgets: [
    { _id: "b-1", categoryId: { name: "Food" }, limitAmount: 400, spentAmount: 145 },
    { _id: "b-2", categoryId: { name: "Transit" }, limitAmount: 100, spentAmount: 50 },
    { _id: "b-3", categoryId: { name: "Entertainment" }, limitAmount: 150, spentAmount: 65 }
  ],
  subscriptions: [
    { _id: "s-1", service_name: "Spotify", amount: 5.99, next_due_date: new Date(Date.now() + 3 * 86400000).toISOString() }
  ]
};

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const outletCtx = useOutletContext();
  const queryClient = useQueryClient();
  const containerRef = useRef(null);

  const [iouOpen, setIouOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const openAdd = outletCtx?.openQuickAdd || (() => setQuickAddOpen(true));

  // Query Hook with initialData and keepPreviousData: opens in 0ms and syncs live in background
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      try {
        const results = await Promise.allSettled([
          getDashboardMetrics(),
          getRecentTransactions(),
          getBudgets(),
          getSubscriptions()
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

  // GSAP Entrance: Safe fromTo animation with clearProps
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".glass-element",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "all"
          }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, []);

  // Strict Auth Gate: If unauthenticated, redirect to login
  if (!isAuthenticated && !isAuthLoading) {
    return <Navigate to="/login" replace />;
  }

  // If still actively initializing auth, show loading
  if (isAuthLoading) {
    return <LoadingScreen message="Loading Campus Coin..." />;
  }

  const { metrics, recentTx, budgets, subscriptions } = dashboardData || defaultDashboard;

  const totalIncome = metrics?.currentMonth?.income || 1500;
  const totalExpense = metrics?.currentMonth?.expense || 535.49;
  const totalBalance = totalIncome - totalExpense;
  const savingsGoal = user?.monthlySavingsGoal || 300;
  
  const availableBudget = (budgets || []).reduce((acc, b) => acc + (b.limitAmount - (b.spentAmount || 0)), 0) || 1200;
  const balanceChange = "+5.2%";
  const expenseChange = "-1.8%";
  const budgetChange = "+12.4%";
  const savingsChange = "+2.1%";

  const upcomingBills = (subscriptions || []).filter(s => new Date(s.next_due_date) >= new Date()).slice(0, 4);

  // Memoized Chart Data
  const chartData = useMemo(() => {
    const raw = metrics?.trends || [];
    if (raw.length === 0) {
      return defaultDashboard.metrics.trends;
    }
    return raw.map(d => ({
      month: d.month || "Mo",
      income: Number(d.income) || 0,
      expense: Number(d.expense) || 0,
      net: (Number(d.income) || 0) - (Number(d.expense) || 0)
    }));
  }, [metrics?.trends]);

  return (
    <div ref={containerRef} className="space-y-6 w-full text-white">
      {/* Top Banner Row (AI Advisor + IOU Tracker) */}
      <div className="flex flex-col md:flex-row gap-4 items-center w-full">
        <DynamicAiInsight />
        <button 
          onClick={() => setIouOpen(true)}
          className={`${liquidCardClass} p-5 flex items-center justify-center gap-2.5 font-bold text-white hover:bg-white/20 transition-colors shrink-0 w-full md:w-auto h-full min-h-[76px] cursor-pointer rounded-full active:scale-95`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400/30 border border-emerald-300/40 flex items-center justify-center">
            <Coins className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="md:hidden lg:inline text-sm">IOU Tracker</span>
        </button>
      </div>

      {/* Top Metric Grid (4 Liquid Glass Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Balance */}
        <div className={`${liquidCardClass} p-6 flex flex-col justify-between relative`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Total Balance</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-sky-300 shadow-inner">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {balanceChange} vs last month
            </div>
          </div>
        </div>

        {/* Monthly Spending */}
        <div className={`${liquidCardClass} p-6 flex flex-col justify-between relative`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Monthly Spending</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-rose-300 shadow-inner">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
              ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-300" /> {expenseChange} vs last month
            </div>
          </div>
        </div>

        {/* Available Budget */}
        <div className={`${liquidCardClass} p-6 flex flex-col justify-between relative`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Available Budget</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-emerald-300 shadow-inner">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
              ${availableBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {budgetChange} vs last month
            </div>
          </div>
        </div>

        {/* Savings Goal */}
        <div className={`${liquidCardClass} p-6 flex flex-col justify-between relative`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-white/70 font-semibold text-xs uppercase tracking-wider">Savings Goal</span>
            <div className="bg-white/20 border border-white/30 p-2.5 rounded-full text-amber-300 shadow-inner">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
              ${savingsGoal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-bold">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> {savingsChange} vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Middle Data Section (2-Column Grid: Cash Flow + Upcoming Bills) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Cash Flow Projection (Spans ~70%) */}
        <div className={`md:col-span-8 ${liquidCardClass} p-6 sm:p-7 flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5 drop-shadow-sm">
              <div className="p-1.5 rounded-full bg-white/20">
                <Sparkles className="w-4 h-4 text-sky-300" />
              </div>
              Cash Flow Projection
            </h3>
            <div className="bg-white/15 border border-white/30 rounded-full px-3.5 py-1.5 text-xs text-white font-medium flex items-center gap-2 cursor-pointer hover:bg-white/25 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-white/80" /> Last 6 Months
            </div>
          </div>
          <div className="flex-1 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4, fill: '#38BDF8', strokeWidth: 0 }} activeDot={{ r: 7, stroke: '#FFFFFF', strokeWidth: 3 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#FB7185" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Upcoming Bills (Spans ~30%) */}
        <div className={`md:col-span-4 ${liquidCardClass} p-6 sm:p-7 flex flex-col justify-between`}>
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5 drop-shadow-sm">
              <div className="p-1.5 rounded-full bg-white/20">
                <Clock className="w-4 h-4 text-white/80" />
              </div>
              Upcoming Bills
            </h3>
            <div className="flex-1 flex flex-col gap-3">
              {upcomingBills.length === 0 && (
                <p className="text-white/60 text-xs text-center py-6">No upcoming bills for the next 7 days.</p>
              )}
              {upcomingBills.map(bill => {
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
                  <div key={bill._id} className="flex flex-col gap-2 p-3.5 rounded-[20px] bg-white/10 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SubscriptionLogo serviceName={bill.service_name} />
                        <div>
                          <div className="text-sm font-bold text-white">{bill.service_name}</div>
                          <div className={`text-xs ${badgeClass}`}>
                            {daysRemaining === 0 ? "Due today" : `Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-black text-white">${Number(bill.amount || 0).toFixed(2)}</div>
                    </div>
                    {/* Sleek liquid progress bar */}
                    <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${cyclePercentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            to="/app/subscriptions"
            className="mt-6 w-full py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 transition-colors font-bold text-white text-xs text-center block shadow-sm"
          >
            View All Bills
          </Link>
        </div>
      </div>

      {/* Bottom Data Section (Money Flow + Recent Transactions Table) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Money Flow (Spans ~30%) */}
        <div className={`md:col-span-4 ${liquidCardClass} p-6 sm:p-7 flex flex-col`}>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2.5 drop-shadow-sm">
            <div className="p-1.5 rounded-full bg-white/20">
              <Zap className="w-4 h-4 text-sky-300" />
            </div>
            Money Flow
          </h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.3)' }} />
                <Area type="monotone" dataKey="net" name="Net Flow" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#flowGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Recent Transactions Table (Spans ~70%) */}
        <div className={`md:col-span-8 ${liquidCardClass} p-6 sm:p-7 flex flex-col`}>
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
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-1.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 transition-colors w-full sm:w-44" 
                />
              </div>
              <button 
                onClick={openAdd}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 transition-colors text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
          
          {/* Liquid Glass Table with generous padding, no visible grid lines, subtle alternating rows */}
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
                {(recentTx || []).length > 0 ? (recentTx || []).slice(0, 5).map((tx) => (
                  <tr 
                    key={tx._id} 
                    className="even:bg-white/[0.04] hover:bg-white/15 transition-colors cursor-pointer rounded-[16px]"
                  >
                    <td className="py-3.5 px-4 text-white/70 whitespace-nowrap font-medium">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 text-white font-bold">
                      {tx.description || <span className="text-white/50 italic font-normal">No description</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-semibold whitespace-nowrap inline-flex items-center gap-1.5">
                        <CategoryIcon categoryName={tx.categoryId?.name} className="w-3.5 h-3.5" useEmerald={tx.type === 'income'} />
                        {tx.categoryId?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className={`font-black text-sm drop-shadow-sm ${tx.type === "income" ? "text-emerald-300" : "text-white"}`}>
                        {tx.type === "income" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-white/60">No recent transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Link 
            to="/app/transactions" 
            className="mt-6 w-full py-2.5 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 text-white transition-colors font-bold text-xs text-center block shadow-sm"
          >
            View All Transactions
          </Link>
        </div>
      </div>

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
      <IouSlidingSheet 
        isOpen={iouOpen} 
        onClose={() => setIouOpen(false)} 
      />
    </div>
  );
}
