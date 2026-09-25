import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sliders,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import BudgetProgressRing from "./BudgetProgressRing";
import { getBudgets, setBudget, deleteBudget, getBudgetAlerts } from "./budgetApi";
import { getCategories } from "../categories/categoryApi";
import toast from "react-hot-toast";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, aRes, cRes] = await Promise.all([
        getBudgets(selectedMonth),
        getBudgetAlerts(),
        getCategories("expense"),
      ]);
      if (bRes.success) setBudgets(bRes.budgets);
      if (aRes.success) setAlerts(aRes.alerts);
      if (cRes.success) setCategories(cRes.categories);
    } catch {
      toast.error("Failed to load budget rings.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  const summary = useMemo(() => {
    let totalCap = 0;
    let totalSpent = 0;
    let safeCount = 0;
    let warnCount = 0;
    let overCount = 0;

    budgets.forEach((b) => {
      const cap = Number(b.limitAmount) || 0;
      const spent = Number(b.spentAmount) || 0;
      totalCap += cap;
      totalSpent += spent;

      const pct = cap > 0 ? (spent / cap) * 100 : 0;
      if (pct >= 100) overCount++;
      else if (pct >= 75) warnCount++;
      else safeCount++;
    });

    const overallPct = totalCap > 0 ? Math.round((totalSpent / totalCap) * 100) : 0;
    return { totalCap, totalSpent, safeCount, warnCount, overCount, overallPct };
  }, [budgets]);

  const handleOpenSetModal = (b = null) => {
    if (b) {
      setSelectedCatId(b.categoryId?._id || b.categoryId);
      setLimitInput(b.limitAmount.toString());
    } else {
      const unusedCat = categories.find(
        (c) => !budgets.some((bg) => (bg.categoryId?._id || bg.categoryId) === c._id)
      );
      setSelectedCatId(unusedCat?._id || categories[0]?._id || "");
      setLimitInput("100");
    }
    setModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedCatId || !limitInput || parseFloat(limitInput) <= 0) {
      toast.error("Enter a valid monthly cap.");
      return;
    }
    setSaving(true);
    try {
      const res = await setBudget({
        categoryId: selectedCatId,
        month: selectedMonth,
        limitAmount: parseFloat(limitInput),
      });
      if (res.success) {
        toast.success("Budget ring updated!");
        setModalOpen(false);
        fetchBudgetData();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set budget cap.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Remove this category cap?")) return;
    try {
      const res = await deleteBudget(id);
      if (res.success) {
        toast.success("Budget cap removed.");
        fetchBudgetData();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch {
      toast.error("Failed to delete budget cap.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-brand-primary" />
            Gamified Budget Rings
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time visual category caps that alert you before student burn-rate spikes occur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            />
          </div>
          <button
            onClick={() => handleOpenSetModal()}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-brand-primary/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Cap</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
          <span className="text-2xs text-zinc-400 font-medium">Total Monthly Budget Cap</span>
          <div className="mt-1 text-2xl font-bold text-white">${summary.totalCap.toFixed(2)}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
          <span className="text-2xs text-zinc-400 font-medium">Recorded Expenses</span>
          <div className="mt-1 text-2xl font-bold text-brand-coral">${summary.totalSpent.toFixed(2)}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
          <span className="text-2xs text-zinc-400 font-medium">Overall Spent Ratio</span>
          <div className="mt-1 text-2xl font-bold text-brand-primary/80">{summary.overallPct}%</div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-2xs text-zinc-400 font-medium">Ring Health Status</span>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
              <span className="text-brand-mint">{summary.safeCount} Safe</span>
              <span className="text-zinc-500">•</span>
              <span className="text-amber-400">{summary.warnCount} Warn</span>
              <span className="text-zinc-500">•</span>
              <span className="text-brand-coral">{summary.overCount} Over</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts Strip */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Budget Notice:</span>{" "}
              {alerts.length} category cap{alerts.length > 1 ? "s are" : " is"} approaching or exceeding limit.
            </div>
          </div>
          <div className="flex gap-2">
            {alerts.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-2xs"
              >
                {a.budget?.categoryId?.name}: {a.percent}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Rings Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          Rendering dynamic progress rings...
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {budgets.map((b) => (
            <div key={b._id} className="relative group">
              <BudgetProgressRing
                categoryName={b.categoryId?.name || "Category"}
                spentAmount={b.spentAmount || 0}
                limitAmount={b.limitAmount || 100}
                color={b.categoryId?.color || "#6366F1"}
                icon={b.categoryId?.icon || "tag"}
                onEdit={() => handleOpenSetModal(b)}
              />
              <button
                onClick={() => handleDeleteBudget(b._id)}
                className="absolute top-3 right-3 text-3xs text-zinc-500 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                title="Remove Cap"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary text-brand-dark/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Monthly Caps Defined</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            Setting monthly caps (e.g. $50 for Food, $30 for Subscriptions) powers real-time gamified budget rings.
          </p>
          <button
            onClick={() => handleOpenSetModal()}
            className="mt-4 py-2 px-4 rounded-xl bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold shadow-lg shadow-brand-primary/30 transition-all cursor-pointer"
          >
            Create Your First Cap
          </button>
        </div>
      )}

      {/* Set / Adjust Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div
            className="w-full max-w-md bg-brand-dark/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" />
                Configure Monthly Cap
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-brand-obsidian">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Monthly Limit Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                  placeholder="e.g. 50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-zinc-300 text-xs border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Cap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
