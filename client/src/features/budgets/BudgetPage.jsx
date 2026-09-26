import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart,
  Plus,
  AlertTriangle,
  Calendar,
  Sliders,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BudgetProgressRing from "./BudgetProgressRing";
import { getBudgets, setBudget, deleteBudget, getBudgetAlerts } from "./budgetApi";
import { getCategories } from "../categories/categoryApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";

// Date utility helpers
const getCurrentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getNextMonthStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active viewing month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr);

  const currentMonthStr = useMemo(() => getCurrentMonthStr(), []);
  const nextMonthStr = useMemo(() => getNextMonthStr(), []);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [targetMonth, setTargetMonth] = useState(getCurrentMonthStr);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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
      setTargetMonth(selectedMonth);
    } else {
      const unusedCat = categories.find(
        (c) => !budgets.some((bg) => (bg.categoryId?._id || bg.categoryId) === c._id)
      );
      setSelectedCatId(unusedCat?._id || categories[0]?._id || "");
      setLimitInput("100");
      setTargetMonth(selectedMonth);
    }
    setModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedCatId || !limitInput || parseFloat(limitInput) <= 0) {
      toast.error("Enter a valid monthly cap.");
      return;
    }
    if (!targetMonth) {
      toast.error("Please select a target month.");
      return;
    }

    setSaving(true);
    try {
      const res = await setBudget({
        categoryId: selectedCatId,
        month: targetMonth,
        limitAmount: parseFloat(limitInput),
      });
      if (res.success) {
        toast.success(`Budget cap saved for ${formatMonthLabel(targetMonth)}!`);
        setModalOpen(false);
        // If saved for targetMonth and we are on a different month, switch to targetMonth to view it
        if (targetMonth !== selectedMonth) {
          setSelectedMonth(targetMonth);
        } else {
          fetchBudgetData();
        }
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set budget cap.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteBudget(itemToDelete);
      if (res.success) {
        toast.success("Budget cap removed.");
        fetchBudgetData();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch {
      toast.error("Failed to delete budget cap.");
    } finally {
      setItemToDelete(null);
    }
  };

  const isCurrentActive = selectedMonth === currentMonthStr;
  const isNextActive = selectedMonth === nextMonthStr;

  return (
    <div className="space-y-6 text-white">
      {/* Top Header & Month Planning Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <PieChart className="w-4 h-4 text-sky-300" />
            </div>
            Budget Rings & Limits
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Track real-time burn rates or plan ahead for upcoming months.
          </p>
        </div>

        {/* Month Switching Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Month Toggle Tabs */}
          <div className="flex rounded-full bg-white/5 backdrop-blur-xl border border-white/10 p-1">
            <button
              onClick={() => setSelectedMonth(currentMonthStr)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isCurrentActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setSelectedMonth(nextMonthStr)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isNextActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Next Month (Plan)
            </button>
          </div>

          <div className="relative">
            <input
              type="month"
              min={currentMonthStr}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer min-h-[38px]"
            />
          </div>

          <button
            onClick={() => handleOpenSetModal()}
            className="py-2 px-4 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Set Budget Cap</span>
          </button>
        </div>
      </div>

      {/* Active Month Banner Indicator */}
      <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-xs">
        <div className="flex items-center gap-2 text-white/80">
          <Calendar className="w-4 h-4 text-sky-300" />
          <span>Viewing Budget For:</span>
          <span className="font-black text-white text-sm">
            {formatMonthLabel(selectedMonth)}
          </span>
          {isNextActive && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              Future Planning
            </span>
          )}
        </div>
        <span className="text-white/50 text-[11px]">
          {budgets.length} Category Cap{budgets.length !== 1 ? "s" : ""} Configured
        </span>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden" style={{ willChange: "transform, opacity" }}>
          <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Total Monthly Cap</span>
          <div className="mt-2 text-2xl font-black text-white">${summary.totalCap.toFixed(2)}</div>
        </div>

        <div className="base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden" style={{ willChange: "transform, opacity" }}>
          <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Recorded Expenses</span>
          <div className="mt-2 text-2xl font-black text-rose-300">${summary.totalSpent.toFixed(2)}</div>
        </div>

        <div className="base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden" style={{ willChange: "transform, opacity" }}>
          <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Spent Ratio</span>
          <div className="mt-2 text-2xl font-black text-sky-300">{summary.overallPct}%</div>
        </div>

        <div className="base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden flex flex-col justify-between" style={{ willChange: "transform, opacity" }}>
          <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Health Status</span>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-400">{summary.safeCount} Safe</span>
            <span className="text-white/30">•</span>
            <span className="text-amber-300">{summary.warnCount} Warn</span>
            <span className="text-white/30">•</span>
            <span className="text-rose-400">{summary.overCount} Over</span>
          </div>
        </div>
      </div>

      {/* Active Alerts Strip */}
      {alerts.length > 0 && isCurrentActive && (
        <div className="p-4 rounded-[20px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Limit Alert:</span>{" "}
              {alerts.length} category cap{alerts.length > 1 ? "s are" : " is"} approaching or exceeding budget.
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {alerts.slice(0, 3).map((a, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-[10px]"
              >
                {a.budget?.categoryId?.name}: {a.percent}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Rings Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-white/70 flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                className="absolute top-3 right-3 text-xs text-white/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
                title="Remove Cap"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="base-glass glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 shadow-inner">
            <PieChart className="w-6 h-6 text-sky-300" />
          </div>
          <h3 className="text-base font-bold text-white">No Caps For {formatMonthLabel(selectedMonth)}</h3>
          <p className="text-xs text-white/60 max-w-sm mt-1">
            Setting monthly caps (e.g. $50 for Food, $30 for Subscriptions) powers real-time gamified budget rings.
          </p>
          <button
            onClick={() => handleOpenSetModal()}
            className="mt-4 py-2.5 px-5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            Create Cap For {formatMonthLabel(selectedMonth)}
          </button>
        </div>
      )}

      {/* Advanced Budget Creation / Configuration Modal */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-[6px] -z-10"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-white/[0.03] backdrop-blur-[64px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 space-y-4 text-white relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
                  <Sliders className="w-4 h-4 text-sky-300" />
                  Configure Budget Cap
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
                {/* Target Month Selector (Current Month vs Next Month vs Custom) */}
                <div>
                  <label className="block text-white/80 font-semibold mb-2">
                    Target Month
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setTargetMonth(currentMonthStr)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        targetMonth === currentMonthStr
                          ? "bg-white/20 border-white text-white shadow-sm"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      📅 Current Month
                      <span className="block text-[10px] font-normal text-white/50 mt-0.5">
                        {formatMonthLabel(currentMonthStr)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMonth(nextMonthStr)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        targetMonth === nextMonthStr
                          ? "bg-white/20 border-white text-white shadow-sm"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      🚀 Next Month
                      <span className="block text-[10px] font-normal text-white/50 mt-0.5">
                        {formatMonthLabel(nextMonthStr)}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/50">Custom Month:</span>
                    <input
                      type="month"
                      min={currentMonthStr}
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-white/40 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-white/80 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs cursor-pointer focus:outline-none focus:border-brand-primary"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id} className="bg-[#0B0D0E] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monthly Limit Amount */}
                <div>
                  <label className="block text-white/80 font-semibold mb-1">
                    Monthly Limit Cap ($ USD)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={limitInput}
                    onChange={(e) => setLimitInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-brand-primary"
                    placeholder="e.g. 150.00"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 hover:text-white text-xs font-semibold border border-white/10 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/40 cursor-pointer shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : `Save Cap (${formatMonthLabel(targetMonth)})`}
                  </button>
                </div>
              </form>
            </motion.div>
            </div>
          )}
          </AnimatePresence>
        </Portal>

      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Budget Cap"
        message="Are you sure you want to remove this category cap?"
        confirmText="Remove Cap"
      />
    </div>
  );
}
