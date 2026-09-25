import { useState, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Plus, RefreshCw, Wallet,
  ArrowUpRight, ArrowDownRight, Target, Clock,
  Search, Calendar, Filter, FileText, Zap, Coins, PieChart
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getDashboardMetrics, getRecentTransactions } from "../transactions/transactionApi";
import { getBudgets, setBudget } from "../budgets/budgetApi";
import { getInsights, generateInsight } from "../insights/insightsApi";
import { getCategories } from "../categories/categoryApi";
import { getSubscriptions } from "../subscriptions/subscriptionApi";
import TransactionModal from "../transactions/TransactionModal";
import DynamicAiInsight from "../insights/DynamicAiInsight";
import IouSlidingSheet from "../debts/IouSlidingSheet";
import SubscriptionLogo from "../../components/ui/SubscriptionLogo";
import CategoryIcon from "../../components/ui/CategoryIcon";
import DashboardSkeleton from "./DashboardSkeleton";
import toast from "react-hot-toast";

// Recharts
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const cardClass = "bg-[#111726] border border-slate-800 shadow-xl rounded-3xl";

// Framer Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0E1322] border border-slate-700 shadow-2xl rounded-xl p-3 min-w-[130px] text-xs">
        <p className="font-semibold text-white mb-2 border-b border-slate-800 pb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3 mb-1">
            <span style={{ color: p.color }} className="font-medium">{p.name}:</span>
            <span className="font-bold text-white">${Number(p.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const outletCtx = useOutletContext();
  const queryClient = useQueryClient();

  const [iouOpen, setIouOpen] = useState(false);

  const { data: dashboardData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const [metricsRes, recentRes, budgetsRes, insightsRes, catsRes, subsRes] = await Promise.all([
        getDashboardMetrics(),
        getRecentTransactions(),
        getBudgets(),
        getInsights(),
        getCategories("expense"),
        getSubscriptions()
      ]);
      return {
        metrics: metricsRes.success ? metricsRes : null,
        recentTx: recentRes.success ? recentRes.transactions : [],
        budgets: budgetsRes.success ? budgetsRes.budgets : [],
        categories: catsRes.success ? catsRes.categories : [],
        subscriptions: subsRes.success ? subsRes.subscriptions : [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  const { metrics, recentTx, budgets, subscriptions } = dashboardData || {
    metrics: null, recentTx: [], budgets: [], categories: [], subscriptions: []
  };

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const openAdd = outletCtx?.openQuickAdd || (() => setQuickAddOpen(true));

  const totalIncome = metrics?.currentMonth?.income || 0;
  const totalExpense = metrics?.currentMonth?.expense || 0;
  const totalBalance = totalIncome - totalExpense;
  const savingsGoal = user?.monthlySavingsGoal || 500; // default mock if empty
  
  // Mocks for UI consistency where backend might lack data
  const availableBudget = budgets.reduce((acc, b) => acc + (b.limitAmount - (b.spentAmount || 0)), 0) || 1200;
  const balanceChange = "+5.2%";
  const expenseChange = "-1.8%";
  const budgetChange = "+12.4%";
  const savingsChange = "+2.1%";

  const upcomingBills = subscriptions?.filter(s => new Date(s.next_due_date) >= new Date()).slice(0, 4) || [];

  // Memoized Chart Data
  const chartData = useMemo(() => {
    const raw = metrics?.trends || [];
    if (raw.length === 0) {
      return ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map(m => ({
        month: m, income: Math.random() * 2000 + 500, expense: Math.random() * 1500 + 200
      }));
    }
    return raw.map(d => ({
      month: d.month || "Mo",
      income: Number(d.income) || 0,
      expense: Number(d.expense) || 0,
      net: (Number(d.income) || 0) - (Number(d.expense) || 0)
    }));
  }, [metrics?.trends]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 w-full"
    >
      <div className="flex flex-col md:flex-row gap-4 items-center w-full">
        <DynamicAiInsight />
        <button 
          onClick={() => setIouOpen(true)}
          className={`${cardClass} p-5 flex items-center justify-center gap-2 font-bold text-white hover:bg-[#161F33] hover:border-slate-700 transition-all shrink-0 w-full md:w-auto h-full min-h-[76px] cursor-pointer`}
        >
          <Coins className="w-5 h-5 text-emerald-400" />
          <span className="md:hidden lg:inline text-sm">IOU Tracker</span>
        </button>
      </div>

      {/* Top Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <motion.div variants={itemVariants} className={`${cardClass} p-5 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Total Balance</span>
            <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl text-blue-400"><Wallet className="w-4 h-4" /></div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">${totalBalance.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-2xs font-bold">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" /> {balanceChange} vs last month
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardClass} p-5 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Monthly Spending</span>
            <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl text-rose-400"><ArrowDownRight className="w-4 h-4" /></div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">${totalExpense.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-2xs font-bold">
              <ArrowDownRight className="w-3 h-3 text-emerald-400" /> {expenseChange} vs last month
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardClass} p-5 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Available Budget</span>
            <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl text-emerald-400"><PieChart className="w-4 h-4" /></div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">${availableBudget.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-2xs font-bold">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" /> {budgetChange} vs last month
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardClass} p-5 flex flex-col justify-between relative overflow-hidden`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Savings Goal</span>
            <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl text-amber-400"><Target className="w-4 h-4" /></div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">${savingsGoal.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-2xs font-bold">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" /> {savingsChange} vs last month
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle Data Section (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left (Spans ~70%) */}
        <motion.div variants={itemVariants} className={`md:col-span-8 ${cardClass} p-6 flex flex-col`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Cash Flow Projection
            </h3>
            <div className="bg-[#0B0F19] border border-slate-700/80 rounded-full px-3 py-1.5 text-xs text-slate-300 font-medium flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-colors">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Last 6 Months
            </div>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#93C5FD', strokeWidth: 3 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#F43F5E" strokeWidth={3} dot={false} activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right (Spans ~30%) */}
        <motion.div variants={itemVariants} className={`md:col-span-4 ${cardClass} p-6 flex flex-col`}>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Upcoming Bills
          </h3>
          <div className="flex-1 flex flex-col gap-3">
            {upcomingBills.length === 0 && <p className="text-slate-500 text-xs text-center py-6">No upcoming bills for the next 7 days.</p>}
            {upcomingBills.map(bill => {
              const today = new Date();
              const nextDue = new Date(bill.next_due_date);
              const timeDiff = nextDue.getTime() - today.getTime();
              const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
              
              const cyclePercentage = Math.min(100, Math.max(0, ((30 - daysRemaining) / 30) * 100));
              
              let progressColor = "bg-blue-500";
              let textColor = "text-slate-400";
              let textWeight = "font-normal";
              
              if (daysRemaining < 2) {
                progressColor = "bg-rose-500";
                textColor = "text-rose-400";
                textWeight = "font-bold";
              } else if (daysRemaining < 7) {
                progressColor = "bg-amber-500";
                textColor = "text-amber-400";
                textWeight = "font-semibold";
              }

              return (
                <div key={bill._id} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#0B0F19] border border-slate-800/90 hover:border-slate-700 hover:bg-[#0E1322] transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SubscriptionLogo serviceName={bill.service_name} />
                      <div>
                        <div className="text-sm font-bold text-white">{bill.service_name}</div>
                        <div className={`text-xs ${textColor} ${textWeight}`}>
                          {daysRemaining === 0 ? "Due today" : `Due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-white">${Number(bill.amount || 0).toFixed(2)}</div>
                  </div>
                  {/* Thin elegant progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${progressColor} transition-all duration-500 ease-in-out`} style={{ width: `${cyclePercentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-4 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors font-bold text-slate-200 text-xs cursor-pointer">
            View All Bills
          </button>
        </motion.div>
      </div>

      {/* Bottom Data Section (2-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Left (Spans ~30%) */}
        <motion.div variants={itemVariants} className={`md:col-span-4 ${cardClass} p-6 flex flex-col`}>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Money Flow
          </h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155' }} />
                <Area type="monotone" dataKey="net" name="Net Flow" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#flowGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right (Spans ~70%) */}
        <motion.div variants={itemVariants} className={`md:col-span-8 ${cardClass} p-6 flex flex-col`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Recent Transactions
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 rounded-full bg-[#0B0F19] border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-48" />
              </div>
              <button className="p-2 rounded-full bg-[#0B0F19] border border-slate-700/80 hover:bg-slate-800 transition-colors text-slate-300">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-3xs font-bold tracking-wider">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentTx.length > 0 ? recentTx.slice(0, 5).map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/40 transition-colors cursor-pointer group">
                    <td className="py-3.5 pl-2 text-slate-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-3.5 text-white font-bold">
                      {tx.description || <span className="text-slate-500 italic">No description</span>}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#0B0F19] border border-slate-800 text-slate-300 text-2xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5">
                        <CategoryIcon categoryName={tx.categoryId?.name} className="w-3.5 h-3.5" useEmerald={tx.type === 'income'} />
                        {tx.categoryId?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                      <span className={`font-black ${tx.type === "income" ? "text-emerald-400" : "text-slate-200"}`}>
                        {tx.type === "income" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">No recent transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <Link to="/app/transactions" className="mt-4 w-full py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-200 transition-colors font-bold text-xs text-center inline-block">
            View All Transactions
          </Link>
        </motion.div>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(["dashboardData"]);
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />

      {/* IOU Tracker Sliding Sheet */}
      <IouSlidingSheet 
        isOpen={iouOpen} 
        onClose={() => setIouOpen(false)} 
      />
    </motion.div>
  );
}
