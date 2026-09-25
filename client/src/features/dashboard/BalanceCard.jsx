import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Flame, Plus } from "lucide-react";

export default function BalanceCard({
  income = 0,
  expense = 0,
  savingsGoal = 0,
  allowance = 0,
  onOpenQuickAdd,
}) {
  const { netBalance, savingsRate, isSurplus, dailyBurn } = useMemo(() => {
    const net = income - expense;
    const rate = income > 0 ? Math.round((net / income) * 100) : 0;
    const dayOfMonth = new Date().getDate();
    const burn = dayOfMonth > 0 ? expense / dayOfMonth : 0;

    return {
      netBalance: net,
      savingsRate: Math.max(0, rate),
      isSurplus: net >= 0,
      dailyBurn: burn,
    };
  }, [income, expense]);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Primary Balance Hero Card */}
      <div className="md:col-span-1 bg-gradient-to-br from-indigo-900/40 via-brand-obsidian/60 to-black/80 backdrop-blur-xl border border-brand-primary/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 bg-brand-primary text-brand-dark/20 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-brand-primary/80 font-semibold flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-brand-primary" />
              Net Student Balance
            </span>
            <span
              className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${
                isSurplus
                  ? "bg-brand-mint/10 text-brand-mint border-brand-mint/20"
                  : "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
              }`}
            >
              {isSurplus ? "+ Surplus" : "- Deficit"}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
              <span>{isSurplus ? "$" : "-$"}</span>
              <span>{Math.abs(netBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Active cash surplus across this monthly cycle.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-2xs text-zinc-400">
            <span>Daily Burn Velocity:</span>
            <span className="text-white font-semibold ml-1 flex items-center gap-1 inline-flex">
              <Flame className="w-3 h-3 text-amber-400" />
              ${dailyBurn.toFixed(2)}/day
            </span>
          </div>
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="py-1.5 px-3 rounded-lg bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold shadow-md shadow-brand-primary/30 flex items-center gap-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Log
            </button>
          )}
        </div>
      </div>

      {/* Income & Expense Breakdown Cards */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Inflow Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Income / Allowance</span>
            <div className="w-8 h-8 rounded-xl bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center text-brand-mint">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white">
              ${income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {allowance > 0 && (
              <p className="text-2xs text-zinc-400 mt-0.5">
                Baseline Allowance: <strong className="text-zinc-200">${allowance}</strong>
              </p>
            )}
          </div>
          <div className="text-2xs text-brand-mint/90 font-medium">
            Tracks allowances, stipends & part-time pay.
          </div>
        </div>

        {/* Total Outflow Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Monthly Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-brand-coral/10 border border-brand-coral/20 flex items-center justify-center text-brand-coral">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white">
              ${expense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {savingsGoal > 0 && (
              <p className="text-2xs text-zinc-400 mt-0.5 flex items-center gap-1">
                <PiggyBank className="w-3 h-3 text-brand-primary" />
                Target Savings: <strong className="text-zinc-200">${savingsGoal}</strong>
              </p>
            )}
          </div>
          <div className="text-2xs text-zinc-400">
            {income > 0 ? (
              <span>Spending Ratio: <strong className="text-zinc-200">{Math.round((expense / income) * 100)}%</strong> of income</span>
            ) : (
              <span>Keep expenses below category budget caps</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
