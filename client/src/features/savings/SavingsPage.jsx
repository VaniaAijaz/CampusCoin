import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShieldCheck,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import {
  getSavingsSummary,
  updateSavingsGoal,
  depositToSavings,
  withdrawSavings,
} from "./savingsApi";
import { formatCurrency, getCurrencySymbol } from "../../utils/currencyUtils";
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
  // Setting a goal (e.g. 50) deducts from overview balance into the goal allocation
  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    const val = parseFloat(editGoalInput);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid goal amount (0 or more).");
      return;
    }

    setIsUpdatingGoal(true);
    try {
      const res = await updateSavingsGoal(val);
      if (res.success) {
        toast.success(`Savings Goal Target updated to ${formatCurrency(val, cur)}!`);
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
  // Depositing savings (e.g. 25) deducts from remaining goal target and adds to current saved (vault), WITHOUT double-deducting from overview
  const handleDepositSavings = async (e) => {
    e.preventDefault();
    const val = parseFloat(depositInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid positive amount to deposit.");
      return;
    }

    setIsDepositing(true);
    try {
      const res = await depositToSavings(val);
      if (res.success) {
        toast.success(`Saved ${formatCurrency(val, cur)} into your Vault!`);
        setDepositInput("");
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
    e.preventDefault();
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
        toast.success(`Withdrew ${formatCurrency(val, cur)} from savings.`);
        setWithdrawInput("");
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
    <div className="dash-root" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {/* ── PAGE HEADER ── */}
      <div className="dash-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--dash-blue)", display: "inline-block" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--dash-blue)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Student Financial Vault
            </span>
          </div>
          <h1 className="dash-page-title">Savings & Goal Allocator</h1>
          <p className="dash-page-desc">
            Allocate your savings goal from your overall balance and lock funds securely into your vault.
          </p>
        </div>

        <div className="dash-page-actions">
          <button
            onClick={fetchSummary}
            className="dash-btn-secondary"
            title="Refresh balances"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI SUMMARY STRIP ── */}
      <div className="dash-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {/* 1. Overview Available Balance */}
        <div className="dash-kpi-card" style={{ borderLeft: "4px solid #2563eb" }}>
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Overview Balance</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#0f172a" }}>
            {formatCurrency(summary.availableOverviewBalance, cur)}
          </div>
          <div className="dash-kpi-hint" style={{ color: "var(--dash-muted)", marginTop: "4px" }}>
            After goal allocation (Available to spend)
          </div>
        </div>

        {/* 2. Target Savings Goal */}
        <div className="dash-kpi-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Goal Target</span>
            <div className="dash-kpi-icon-box" style={{ background: "#f3e8ff", color: "#8b5cf6" }}>
              <Target size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#8b5cf6" }}>
            {formatCurrency(summary.goalAmount, cur)}
          </div>
          <div className="dash-kpi-hint" style={{ color: "var(--dash-muted)", marginTop: "4px" }}>
            Allocated from overview balance
          </div>
        </div>

        {/* 3. Current Saved / In Vault */}
        <div className="dash-kpi-card" style={{ borderLeft: "4px solid #16a34a" }}>
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Saved (Vault)</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-emerald-soft)", color: "var(--dash-emerald)" }}>
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "var(--dash-emerald)" }}>
            {formatCurrency(summary.currentSaved, cur)}
          </div>
          <div className="dash-kpi-hint" style={{ color: "var(--dash-emerald)", fontWeight: 700, marginTop: "4px" }}>
            {progressPercentage}% of goal achieved
          </div>
        </div>

        {/* 4. Remaining Goal to Save */}
        <div className="dash-kpi-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Remaining to Goal</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fef3c7", color: "#d97706" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#d97706" }}>
            {formatCurrency(summary.remainingGoal, cur)}
          </div>
          <div className="dash-kpi-hint" style={{ color: "var(--dash-muted)", marginTop: "4px" }}>
            Left to complete this target
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE GOAL PROGRESS BAR BANNER ── */}
      <div
        className="dash-card"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)",
          border: "1px solid rgba(219, 234, 254, 0.9)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--dash-foreground)", margin: 0 }}>
                Savings Goal Milestone Progress
              </h3>
              <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "2px 0 0" }}>
                {summary.currentSaved >= summary.goalAmount && summary.goalAmount > 0
                  ? "🎉 Goal Target Completed! Outstanding discipline."
                  : `${formatCurrency(summary.currentSaved, cur)} saved of ${formatCurrency(summary.goalAmount, cur)} allocated target`}
              </p>
            </div>
          </div>

          <span
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              background: progressPercentage >= 100 ? "var(--dash-emerald-soft)" : "var(--dash-blue-soft)",
              color: progressPercentage >= 100 ? "var(--dash-emerald)" : "var(--dash-blue)",
              fontSize: "13px",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {progressPercentage >= 100 ? <CheckCircle2 size={15} /> : <TrendingUp size={15} />}
            {progressPercentage}% Complete
          </span>
        </div>

        {/* Progress Bar Track */}
        <div
          style={{
            width: "100%",
            height: "12px",
            borderRadius: "9999px",
            background: "#e2e8f0",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercentage}%`,
              borderRadius: "9999px",
              background: progressPercentage >= 100
                ? "linear-gradient(90deg, #16a34a, #10b981)"
                : "linear-gradient(90deg, #2563eb, #3b82f6)",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "var(--dash-muted)", fontWeight: 600 }}>
          <span>Saved: {formatCurrency(summary.currentSaved, cur)}</span>
          <span>Target: {formatCurrency(summary.goalAmount, cur)}</span>
        </div>
      </div>

      {/* ── TWO-COLUMN INTERACTIVE CONSOLE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* CARD 1: EDIT / ALLOCATE GOAL TARGET */}
        <div className="dash-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#f3e8ff",
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Target size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--dash-foreground)", margin: 0 }}>
                  1. Set / Edit Goal Target
                </h3>
                <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "2px 0 0" }}>
                  Allocates funds from Overview Balance to Goal
                </p>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--dash-muted)", lineHeight: 1.5, margin: "0 0 16px" }}>
              When you set or increase this goal amount, it deducts from your <strong>Overview Total Balance</strong> and assigns it as your active goal allocation.
            </p>

            <form onSubmit={handleUpdateGoal} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="dash-form-label">Goal Target Amount ({curSymbol})</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--dash-muted)",
                      fontWeight: 700,
                      fontSize: "14px",
                      pointerEvents: "none",
                      userSelect: "none",
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
                    style={{ paddingLeft: curSymbol.length > 2 ? "48px" : "38px", fontWeight: 700, fontSize: "15px" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingGoal}
                className="dash-btn-primary"
                style={{ height: "42px", justifyContent: "center", background: "#8b5cf6", borderColor: "#7c3aed" }}
              >
                <Edit3 size={15} />
                <span>{isUpdatingGoal ? "Allocating..." : "Update Goal Allocation"}</span>
              </button>
            </form>
          </div>

          <div style={{ marginTop: "16px", padding: "10px 12px", borderRadius: "10px", background: "var(--dash-alt-bg)", border: "1px solid var(--dash-border)", fontSize: "11.5px", color: "var(--dash-muted)" }}>
            💡 <strong>Example:</strong> If overview has 100 and you set goal to 50, overview balance becomes 50 and goal allocation becomes 50.
          </div>
        </div>

        {/* CARD 2: DEPOSIT TO SAVINGS (FULFILL GOAL) */}
        <div className="dash-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "var(--dash-emerald-soft)",
                  color: "var(--dash-emerald)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PiggyBank size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--dash-foreground)", margin: 0 }}>
                  2. Deposit / Add to Savings
                </h3>
                <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "2px 0 0" }}>
                  Deducts from Goal Target into your Vault
                </p>
              </div>
            </div>

            <p style={{ fontSize: "12.5px", color: "var(--dash-muted)", lineHeight: 1.5, margin: "0 0 16px" }}>
              Adding savings fulfills your goal target and moves money into your <strong>Saved Vault</strong> without double-deducting from your overview balance.
            </p>

            <form onSubmit={handleDepositSavings} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="dash-form-label">Amount to Save ({curSymbol})</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--dash-muted)",
                      fontWeight: 700,
                      fontSize: "14px",
                      pointerEvents: "none",
                      userSelect: "none",
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
                    style={{ paddingLeft: curSymbol.length > 2 ? "48px" : "38px", fontWeight: 700, fontSize: "15px" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isDepositing}
                className="dash-btn-primary"
                style={{ height: "42px", justifyContent: "center", background: "#16a34a", borderColor: "#15803d" }}
              >
                <Plus size={16} />
                <span>{isDepositing ? "Saving to Vault..." : "Save to Vault"}</span>
              </button>
            </form>
          </div>

          <div style={{ marginTop: "16px", padding: "10px 12px", borderRadius: "10px", background: "var(--dash-alt-bg)", border: "1px solid var(--dash-border)", fontSize: "11.5px", color: "var(--dash-muted)" }}>
            🔒 <strong>Example:</strong> When you add 25 into savings, your remaining goal reduces from 50 to 25, while your overview stays 50.
          </div>
        </div>
      </div>

      {/* ── WITHDRAW FROM VAULT CARD ── */}
      {summary.currentSaved > 0 && (
        <div
          className="dash-card"
          style={{
            padding: "20px 24px",
            border: "1px dashed var(--dash-border)",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Unlock size={18} color="var(--dash-muted)" />
              <div>
                <h4 style={{ fontSize: "14.5px", fontWeight: 800, color: "var(--dash-foreground)", margin: 0 }}>
                  Need Emergency Access to Your Savings?
                </h4>
                <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "2px 0 0" }}>
                  Withdraw funds from your vault back to your overview spending balance.
                </p>
              </div>
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--dash-emerald)" }}>
              Vault Balance: {formatCurrency(summary.currentSaved, cur)}
            </span>
          </div>

          <form onSubmit={handleWithdrawSavings} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--dash-muted)", fontWeight: 700, fontSize: "13px", pointerEvents: "none" }}>
                {curSymbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="Amount to withdraw"
                value={withdrawInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) setWithdrawInput(val);
                }}
                className="dash-input"
                style={{ paddingLeft: curSymbol.length > 2 ? "48px" : "38px" }}
              />
            </div>
            <button
              type="submit"
              disabled={isWithdrawing}
              className="dash-btn-secondary"
              style={{ height: "40px", color: "#dc2626", borderColor: "#fecdd3", background: "#fff5f5" }}
            >
              <ArrowDownRight size={15} />
              <span>{isWithdrawing ? "Processing..." : "Withdraw to Balance"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
