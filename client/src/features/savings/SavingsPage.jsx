import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  Target,
  Wallet,
  ArrowDownRight,
  TrendingUp,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  X,
  ArrowRight,
  Info,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import {
  getSavingsSummary,
  updateSavingsGoal,
  depositToSavings,
  withdrawSavings,
} from "./savingsApi";
import { formatCurrency, getCurrencySymbol } from "../../utils/currencyUtils";
import Portal from "../../components/ui/Portal";
import toast from "react-hot-toast";
import "../dashboard/Dashboard.css";

export default function SavingsPage() {
  const { user, refreshUser } = useAuth();
  const cur = user?.currency_preference || user?.currency || "USD";
  const curSymbol = getCurrencySymbol(cur);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalGrossBalance: 0,
    availableOverviewBalance: 0,
    goalAmount: 0,
    currentSaved: 0,
    remainingGoal: 0,
    progressPct: 0,
  });

  // Modal states
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Form states
  const [editGoalInput, setEditGoalInput] = useState("");
  const [depositInput, setDepositInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSavingsSummary();
      if (res.success && res.summary) {
        setSummary(res.summary);
        setEditGoalInput(res.summary.goalAmount.toString());
      }
    } catch {
      toast.error("Failed to load savings data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // 1. Handle Update / Edit Goal Target
  const handleUpdateGoal = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(editGoalInput);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid goal amount (0 or more).");
      return;
    }

    setIsUpdatingGoal(true);
    try {
      const res = await updateSavingsGoal(val);
      if (res.success) {
        toast.success(`Savings Goal updated to ${formatCurrency(val, cur)}!`);
        setGoalModalOpen(false);
        await fetchSummary();
        if (refreshUser) refreshUser();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update savings goal.");
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  // 2. Handle Deposit Savings
  const handleDepositSavings = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(depositInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid positive amount to save.");
      return;
    }

    setIsDepositing(true);
    try {
      const res = await depositToSavings(val);
      if (res.success) {
        toast.success(`Saved ${formatCurrency(val, cur)} into your Vault!`);
        setDepositInput("");
        setDepositModalOpen(false);
        await fetchSummary();
        if (refreshUser) refreshUser();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deposit to savings.");
    } finally {
      setIsDepositing(false);
    }
  };

  // 3. Handle Withdraw Savings
  const handleWithdrawSavings = async (e) => {
    if (e) e.preventDefault();
    const val = parseFloat(withdrawInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }
    if (val > summary.currentSaved) {
      toast.error(`Cannot withdraw more than your current saved balance (${formatCurrency(summary.currentSaved, cur)}).`);
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await withdrawSavings(val);
      if (res.success) {
        toast.success(`Withdrew ${formatCurrency(val, cur)} back to Overview Balance.`);
        setWithdrawInput("");
        setWithdrawModalOpen(false);
        await fetchSummary();
        if (refreshUser) refreshUser();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw from savings.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const progressPercentage = summary.goalAmount > 0 
    ? Math.min(100, Math.round((summary.currentSaved / summary.goalAmount) * 100))
    : 0;

  return (
    <div className="dash-root">
      {/* ── PAGE HEADER (Matching Budgets/Subscriptions/Khata) ── */}
      <div className="dash-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.02em" }}>
              Student Financial Vault
            </span>
          </div>
          <h1 className="dash-page-title">Savings & Vault</h1>
          <p className="dash-page-desc">
            Allocate your savings goals, track vault milestones, and safely lock student funds.
          </p>
        </div>

        <div className="dash-page-actions">
          <button
            onClick={() => {
              setDepositInput("");
              setDepositModalOpen(true);
            }}
            className="dash-btn-primary"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Deposit Savings</span>
          </button>

          <button
            onClick={() => {
              setEditGoalInput(summary.goalAmount.toString());
              setGoalModalOpen(true);
            }}
            className="dash-btn-secondary"
          >
            <Target style={{ width: 15, height: 15 }} />
            <span>Set / Edit Goal</span>
          </button>

          <button
            onClick={fetchSummary}
            className="dash-btn-secondary"
            title="Refresh balances"
            style={{ width: 40, height: 40, padding: 0 }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── 4 SUMMARY KPI CARDS (Exact match with dash-kpi-card design) ── */}
      <div className="dash-kpi-grid">
        {/* 1. Overview Available Balance */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Overview Balance</span>
            <div className="dash-kpi-icon-box" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Wallet style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val">{formatCurrency(summary.availableOverviewBalance, cur)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb" }}>
              Available
            </span>
            <span className="dash-kpi-hint">After goal deduction</span>
          </div>
        </div>

        {/* 2. Target Savings Goal */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Goal Target</span>
            <div className="dash-kpi-icon-box" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
              <Target style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#7c3aed" }}>
            {formatCurrency(summary.goalAmount, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#f3e8ff", color: "#7c3aed" }}>
              Allocated
            </span>
            <span className="dash-kpi-hint">Reserved from overview</span>
          </div>
        </div>

        {/* 3. Total Saved in Vault */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Saved in Vault</span>
            <div className="dash-kpi-icon-box" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <PiggyBank style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#16a34a" }}>
            {formatCurrency(summary.currentSaved, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#dcfce7", color: "#16a34a" }}>
              {progressPercentage}% Saved
            </span>
            <span className="dash-kpi-hint">Locked safely</span>
          </div>
        </div>

        {/* 4. Remaining to Goal */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Remaining to Goal</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fef3c7", color: "#d97706" }}>
              <TrendingUp style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: summary.remainingGoal > 0 ? "#d97706" : "#16a34a" }}>
            {formatCurrency(summary.remainingGoal, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: summary.remainingGoal > 0 ? "#fef3c7" : "#dcfce7", color: summary.remainingGoal > 0 ? "#d97706" : "#16a34a" }}>
              {summary.remainingGoal > 0 ? "In Progress" : "Completed"}
            </span>
            <span className="dash-kpi-hint">Left to reach target</span>
          </div>
        </div>
      </div>

      {/* ── MILESTONE PROGRESS CARD ── */}
      <div className="dash-card" style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Savings Goal Milestone
              </h3>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: "2px 0 0" }}>
                {summary.currentSaved >= summary.goalAmount && summary.goalAmount > 0
                  ? "Target achieved! You have successfully fulfilled this savings goal."
                  : `${formatCurrency(summary.currentSaved, cur)} deposited of ${formatCurrency(summary.goalAmount, cur)} allocated target`}
              </p>
            </div>
          </div>

          <span
            style={{
              padding: "4px 12px",
              borderRadius: 9999,
              background: progressPercentage >= 100 ? "#dcfce7" : "#eff6ff",
              color: progressPercentage >= 100 ? "#16a34a" : "#2563eb",
              fontSize: 12.5,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {progressPercentage >= 100 ? <CheckCircle2 size={14} /> : <TrendingUp size={14} />}
            {progressPercentage}% Progress
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: 10,
            borderRadius: 9999,
            background: "#f1f5f9",
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercentage}%`,
              borderRadius: 9999,
              background: progressPercentage >= 100
                ? "linear-gradient(90deg, #16a34a, #10b981)"
                : "linear-gradient(90deg, #2563eb, #3b82f6)",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          <span>Saved: <strong style={{ color: "#0f172a" }}>{formatCurrency(summary.currentSaved, cur)}</strong></span>
          <span>Target: <strong style={{ color: "#0f172a" }}>{formatCurrency(summary.goalAmount, cur)}</strong></span>
        </div>
      </div>

      {/* ── 2 INTERACTIVE ACTION PANELS (MATCHING TAB CARDS) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* PANEL 1: SET / EDIT GOAL TARGET */}
        <div className="dash-card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#f3e8ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={18} />
              </div>
              <div>
                <h3 className="dash-card-title">1. Set / Edit Goal Target</h3>
                <p className="dash-card-subtitle">Allocates from Overview Balance into Goal</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 16px" }}>
              Setting a goal amount reserves funds directly from your <strong>Overview Total Balance</strong> and assigns it as your active goal target.
            </p>

            <form onSubmit={handleUpdateGoal} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="dash-form-label">Goal Target Amount ({curSymbol})</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontWeight: 700,
                      fontSize: 14,
                      pointerEvents: "none",
                    }}
                  >
                    {curSymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 50"
                    value={editGoalInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) setEditGoalInput(val);
                    }}
                    className="dash-input"
                    style={{ paddingLeft: curSymbol.length > 2 ? 48 : 36, fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[50, 100, 250, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditGoalInput(preset.toString())}
                    className="dash-btn-secondary"
                    style={{ height: 30, padding: "0 10px", fontSize: 11.5, borderRadius: 8 }}
                  >
                    +{formatCurrency(preset, cur)}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isUpdatingGoal}
                className="dash-btn-primary"
                style={{ height: 42, justifyContent: "center" }}
              >
                <Edit3 size={15} />
                <span>{isUpdatingGoal ? "Allocating..." : "Update Goal Allocation"}</span>
              </button>
            </form>
          </div>

          <div style={{ marginTop: 18, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
            💡 <strong>Flow:</strong> Overview $100 &rarr; Goal $50 = Remaining Overview $50, Goal $50.
          </div>
        </div>

        {/* PANEL 2: DEPOSIT TO SAVINGS (FULFILL GOAL) */}
        <div className="dash-card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PiggyBank size={18} />
              </div>
              <div>
                <h3 className="dash-card-title">2. Add / Deposit to Savings</h3>
                <p className="dash-card-subtitle">Deducts from Goal Target into Vault</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 16px" }}>
              Adding savings fulfills your goal target and moves money into your <strong>Vault</strong> without double-deducting from your overview balance.
            </p>

            <form onSubmit={handleDepositSavings} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="dash-form-label">Amount to Save ({curSymbol})</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontWeight: 700,
                      fontSize: 14,
                      pointerEvents: "none",
                    }}
                  >
                    {curSymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 25"
                    value={depositInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) setDepositInput(val);
                    }}
                    className="dash-input"
                    style={{ paddingLeft: curSymbol.length > 2 ? 48 : 36, fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDepositInput(preset.toString())}
                    className="dash-btn-secondary"
                    style={{ height: 30, padding: "0 10px", fontSize: 11.5, borderRadius: 8 }}
                  >
                    +{formatCurrency(preset, cur)}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isDepositing}
                className="dash-btn-primary"
                style={{ height: 42, justifyContent: "center", background: "linear-gradient(135deg, #16a34a, #15803d)" }}
              >
                <Plus size={16} />
                <span>{isDepositing ? "Saving to Vault..." : "Save to Vault"}</span>
              </button>
            </form>
          </div>

          <div style={{ marginTop: 18, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
            🔒 <strong>Flow:</strong> Goal $50 &rarr; Save $25 = Remaining Goal $25, Vault $25 (Overview remains $50).
          </div>
        </div>
      </div>

      {/* ── EMERGENCY WITHDRAWAL BAR ── */}
      {summary.currentSaved > 0 && (
        <div className="dash-card" style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Unlock size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Emergency Vault Access
              </h4>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                Release locked savings back into your active overview spending balance.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setWithdrawInput("");
              setWithdrawModalOpen(true);
            }}
            className="dash-btn-danger"
            style={{ height: 38, padding: "0 16px" }}
          >
            <ArrowDownRight size={15} />
            <span>Withdraw from Vault</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── MODALS (Exact design as Budgets/Subscriptions) ── */}
      {/* ══════════════════════════════════════════════ */}

      {/* 1. SET / EDIT GOAL MODAL */}
      <Portal>
        <AnimatePresence>
          {goalModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setGoalModalOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(4px)",
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18 }}
                className="dash-card"
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 440,
                  padding: 24,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Target size={18} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                      Set / Edit Goal Target
                    </h3>
                  </div>
                  <button
                    onClick={() => setGoalModalOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleUpdateGoal} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="dash-form-label">Goal Target Amount ({curSymbol})</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 700, pointerEvents: "none" }}>
                        {curSymbol}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        autoFocus
                        placeholder="e.g. 50"
                        value={editGoalInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) setEditGoalInput(val);
                        }}
                        className="dash-input"
                        style={{ paddingLeft: curSymbol.length > 2 ? 48 : 36, fontWeight: 700 }}
                      />
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      Deducts from Overview Balance into active Goal Allocation.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setGoalModalOpen(false)}
                      className="dash-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingGoal}
                      className="dash-btn-primary"
                    >
                      {isUpdatingGoal ? "Saving..." : "Save Goal"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* 2. DEPOSIT SAVINGS MODAL */}
      <Portal>
        <AnimatePresence>
          {depositModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDepositModalOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(4px)",
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18 }}
                className="dash-card"
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 440,
                  padding: 24,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <PiggyBank size={18} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                      Deposit to Savings Vault
                    </h3>
                  </div>
                  <button
                    onClick={() => setDepositModalOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleDepositSavings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label className="dash-form-label">Amount to Deposit ({curSymbol})</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 700, pointerEvents: "none" }}>
                        {curSymbol}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        autoFocus
                        placeholder="e.g. 25"
                        value={depositInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) setDepositInput(val);
                        }}
                        className="dash-input"
                        style={{ paddingLeft: curSymbol.length > 2 ? 48 : 36, fontWeight: 700 }}
                      />
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      Deducts from Remaining Goal into your Vault (Does not deduct overview).
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setDepositModalOpen(false)}
                      className="dash-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isDepositing}
                      className="dash-btn-primary"
                      style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                    >
                      {isDepositing ? "Saving..." : "Confirm Deposit"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      {/* 3. WITHDRAW FROM VAULT MODAL */}
      <Portal>
        <AnimatePresence>
          {withdrawModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setWithdrawModalOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(4px)",
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18 }}
                className="dash-card"
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 440,
                  padding: 24,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Unlock size={18} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                      Emergency Vault Withdrawal
                    </h3>
                  </div>
                  <button
                    onClick={() => setWithdrawModalOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleWithdrawSavings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <label className="dash-form-label" style={{ margin: 0 }}>Amount to Withdraw</label>
                      <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                        Vault: {formatCurrency(summary.currentSaved, cur)}
                      </span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontWeight: 700, pointerEvents: "none" }}>
                        {curSymbol}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        autoFocus
                        placeholder="Amount to release"
                        value={withdrawInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) setWithdrawInput(val);
                        }}
                        className="dash-input"
                        style={{ paddingLeft: curSymbol.length > 2 ? 48 : 36, fontWeight: 700 }}
                      />
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      Returns funds from your Vault back into your Overview spending balance.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setWithdrawModalOpen(false)}
                      className="dash-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isWithdrawing}
                      className="dash-btn-danger"
                      style={{ height: 40, padding: "0 16px" }}
                    >
                      {isWithdrawing ? "Processing..." : "Confirm Withdrawal"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
