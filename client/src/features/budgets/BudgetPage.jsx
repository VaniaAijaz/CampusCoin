import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PieChart, Plus, AlertTriangle, X, Target, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BudgetProgressRing from "./BudgetProgressRing";
import { getBudgets, setBudget, deleteBudget, getBudgetAlerts } from "./budgetApi";
import { getCategories } from "../categories/categoryApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../../utils/currencyUtils";
import "../dashboard/Dashboard.css";

const getCurrentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const getNextMonthStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthLabel = (s) => {
  if (!s) return "";
  const [y, m] = s.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

export default function BudgetPage() {
  const { user } = useAuth();
  const cur = user?.currency_preference || user?.currency || "USD";
  const curSymbol = getCurrencySymbol(cur);

  const [searchParams] = useSearchParams();
  const urlOpen = searchParams.get("open");
  const urlCategory = searchParams.get("category");
  const urlCategoryId = searchParams.get("categoryId");
  const urlLimit = searchParams.get("limit");

  const [budgets, setBudgetsState] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr);
  const currentMonthStr = useMemo(() => getCurrentMonthStr(), []);
  const nextMonthStr = useMemo(() => getNextMonthStr(), []);
  const [modalOpen, setModalOpen] = useState(urlOpen === "create");
  const [selectedCatId, setSelectedCatId] = useState(urlCategoryId || "");
  const [limitInput, setLimitInput] = useState(urlLimit || "");
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
      if (bRes.success) setBudgetsState(bRes.budgets);
      if (aRes.success) setAlerts(aRes.alerts);
      if (cRes.success) setCategories(cRes.categories);
    } catch {
      toast.error("Couldn't load budget data.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  useEffect(() => {
    if (urlCategory && categories.length > 0 && !selectedCatId) {
      const match = categories.find((c) => c.name.toLowerCase() === urlCategory.toLowerCase());
      if (match) setSelectedCatId(match._id);
    }
  }, [urlCategory, categories, selectedCatId]);

  const summary = useMemo(() => {
    const totalCap = budgets.reduce((acc, b) => acc + (b.limitAmount || 0), 0);
    const totalSpent = budgets.reduce((acc, b) => acc + (b.spentAmount || 0), 0);
    const remainingBudget = Math.max(0, totalCap - totalSpent);

    let safeCount = 0;
    let warnCount = 0;
    let overCount = 0;

    budgets.forEach((b) => {
      const pct = b.limitAmount > 0 ? (b.spentAmount / b.limitAmount) * 100 : 0;
      if (pct >= 100) overCount++;
      else if (pct >= 75) warnCount++;
      else safeCount++;
    });

    const rawPct = totalCap > 0 ? Math.round((totalSpent / totalCap) * 100) : 0;
    const isOver = rawPct > 100;

    return {
      totalCap,
      totalSpent,
      remainingBudget,
      safeCount,
      warnCount,
      overCount,
      rawPct,
      overallPct: Math.min(100, rawPct),
      isOverBudget: isOver,
    };
  }, [budgets]);

  const handleOpenSetModal = (b = null) => {
    if (b) {
      setSelectedCatId(b.categoryId?._id || b.categoryId);
      setLimitInput(b.limitAmount.toString());
      setTargetMonth(selectedMonth);
    } else {
      const unused = categories.find((c) => !budgets.some((bg) => (bg.categoryId?._id || bg.categoryId) === c._id));
      setSelectedCatId(unused?._id || categories[0]?._id || "");
      setLimitInput("100");
      setTargetMonth(selectedMonth);
    }
    setModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedCatId || !limitInput || parseFloat(limitInput) <= 0) {
      toast.error("Please enter a valid monthly limit.");
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
        toast.success(`Budget saved for ${formatMonthLabel(targetMonth)}.`);
        setModalOpen(false);
        if (targetMonth !== selectedMonth) setSelectedMonth(targetMonth);
        else fetchBudgetData();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set budget.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = (id) => setItemToDelete(id);
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteBudget(itemToDelete);
      if (res.success) {
        toast.success("Budget limit removed.");
        fetchBudgetData();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch {
      toast.error("Failed to delete budget limit.");
    } finally {
      setItemToDelete(null);
    }
  };

  const isCurrentActive = selectedMonth === currentMonthStr;

  return (
    <div className="dash-root">
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.02em" }}>
              Monthly Allocations
            </span>
          </div>
          <h1 className="dash-page-title">Budgets</h1>
          <p className="dash-page-desc">Set limits for your spending and track category progress in real time.</p>
        </div>

        <div className="dash-page-actions">
          <button onClick={() => handleOpenSetModal()} className="dash-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            <span>Set Budget</span>
          </button>
        </div>
      </div>

      {/* ── Month Selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Current Month", val: currentMonthStr },
          { label: "Next Month (Plan)", val: nextMonthStr },
        ].map((t) => (
          <button
            key={t.val}
            onClick={() => setSelectedMonth(t.val)}
            className="dash-btn-secondary"
            style={{
              height: 38,
              background: selectedMonth === t.val ? "#2563eb" : "#ffffff",
              color: selectedMonth === t.val ? "#ffffff" : "#0f172a",
              borderColor: selectedMonth === t.val ? "#2563eb" : "#e2e8f0",
              fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        ))}

        <input
          type="month"
          min={currentMonthStr}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="dash-input"
          style={{ width: "auto", height: 38, padding: "0 14px", cursor: "pointer" }}
        />
      </div>

      {/* ── Summary KPI Strip ── */}
      <div className="dash-kpi-grid">
        {/* Monthly Limit */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Monthly Limit</span>
            <div className="dash-kpi-icon-box" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Target style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val">{formatCurrency(summary.totalCap, cur)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb" }}>
              Planned
            </span>
            <span className="dash-kpi-hint">Total monthly cap</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Spent</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <PieChart style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: summary.isOverBudget ? "#dc2626" : "#0f172a" }}>
            {formatCurrency(summary.totalSpent, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 9999,
                background: summary.isOverBudget ? "#fee2e2" : "#dcfce7",
                color: summary.isOverBudget ? "#dc2626" : "#16a34a",
              }}
            >
              {summary.isOverBudget ? `${summary.rawPct}% (Exceeded)` : `${summary.overallPct}% spent`}
            </span>
            <span className="dash-kpi-hint">{summary.isOverBudget ? "Over allowance" : "Of monthly cap"}</span>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Remaining Budget</span>
            <div className="dash-kpi-icon-box" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <CheckCircle2 style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#16a34a" }}>
            {formatCurrency(summary.remainingBudget, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#dcfce7", color: "#16a34a" }}>
              Safe to spend
            </span>
            <span className="dash-kpi-hint">Available buffer</span>
          </div>
        </div>

        {/* Budget Status */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Budget Status</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fef3c7", color: "#d97706" }}>
              <Clock style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 2px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{summary.safeCount} On Track</span>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>{summary.warnCount} Warn</span>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{summary.overCount} Over</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#fef3c7", color: "#d97706" }}>
              {budgets.length} configured
            </span>
            <span className="dash-kpi-hint">Categories active</span>
          </div>
        </div>
      </div>

      {/* ── Active Warning Alerts ── */}
      {alerts.length > 0 && isCurrentActive && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderRadius: 16,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle style={{ width: 18, height: 18, color: "#d97706", flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#92400e" }}>
              <strong>{alerts.length}</strong> budget limit{alerts.length > 1 ? "s" : ""} approaching or exceeding target.
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {alerts.slice(0, 3).map((a, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 9999,
                  background: "#fef3c7",
                  color: "#92400e",
                  border: "1px solid #fbbf24",
                }}
              >
                {a.budget?.categoryId?.name}: {Math.round(a.percent)}% {a.percent >= 100 ? "(Exceeded)" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Budget Rings & Cards Grid ── */}
      {loading ? (
        <div style={{ padding: "64px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b", fontSize: 14 }}>
          <span
            style={{
              width: 20,
              height: 20,
              border: "2px solid #e2e8f0",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <span>Loading budgets...</span>
        </div>
      ) : budgets.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {budgets.map((b) => (
            <BudgetProgressRing
              key={b._id}
              categoryName={b.categoryId?.name || "Category"}
              spentAmount={b.spentAmount || 0}
              limitAmount={b.limitAmount || 100}
              color={b.categoryId?.color || "#2563eb"}
              icon={b.categoryId?.icon || "tag"}
              onEdit={() => handleOpenSetModal(b)}
              onDelete={() => handleDeleteBudget(b._id)}
            />
          ))}
        </div>
      ) : (
        <div className="dash-empty-box">
          <div className="dash-empty-icon">
            <PieChart style={{ width: 24, height: 24 }} />
          </div>
          <h3 className="dash-empty-title">No budget limits for {formatMonthLabel(selectedMonth)}</h3>
          <p className="dash-empty-desc">Set limits for categories like Food, Books, or Transport to stay within your student allowance.</p>
          <button onClick={() => handleOpenSetModal()} className="dash-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            <span>Set First Budget</span>
          </button>
        </div>
      )}

      {/* ── Set Budget Modal ── */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <motion.div
                key="bd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)", zIndex: -1 }}
              />
              <motion.div
                key="modal"
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: 440,
                  background: "#ffffff",
                  borderRadius: 22,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 24px 64px rgba(15,23,42,0.15)",
                  padding: "26px 28px",
                  fontFamily: "var(--dash-font)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2563eb", marginBottom: 2 }}>
                      Spending Limit
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Set Category Budget
                    </h3>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid #e2e8f0",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                <form onSubmit={handleSaveBudget} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Target Month
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 4, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 8 }}>
                      {[
                        { label: "Current Month", sub: formatMonthLabel(currentMonthStr), val: currentMonthStr },
                        { label: "Next Month", sub: formatMonthLabel(nextMonthStr), val: nextMonthStr },
                      ].map((t) => (
                        <button
                          key={t.val}
                          type="button"
                          onClick={() => setTargetMonth(t.val)}
                          style={{
                            padding: "9px 8px",
                            borderRadius: 9,
                            cursor: "pointer",
                            background: targetMonth === t.val ? "#091227" : "transparent",
                            color: targetMonth === t.val ? "#ffffff" : "#64748b",
                            border: "none",
                            fontSize: 12.5,
                            fontWeight: 700,
                            transition: "all 0.15s",
                          }}
                        >
                          {t.label}
                          <span style={{ display: "block", fontSize: 10, fontWeight: 500, opacity: 0.75, marginTop: 2 }}>{t.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Category
                    </label>
                    <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="dash-select" style={{ width: "100%" }}>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Monthly Limit ({curSymbol.trim()})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="e.g. 150.00"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      className="dash-input"
                      style={{ fontWeight: 800, fontSize: 15 }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                    <button type="button" onClick={() => setModalOpen(false)} className="dash-btn-secondary" style={{ height: 44 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="dash-btn-primary" style={{ height: 44 }}>
                      {saving ? "Saving..." : "Save Budget"}
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
        title="Remove Budget Limit"
        message="Are you sure you want to remove this category budget limit?"
        confirmText="Remove Limit"
      />
    </div>
  );
}
