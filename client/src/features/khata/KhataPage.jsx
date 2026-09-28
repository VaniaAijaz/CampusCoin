import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, ArrowUpRight, ArrowDownRight,
  Check, Trash2, AlertTriangle, CheckCircle2,
  Calendar, User, DollarSign, X, Clock, Filter,
} from "lucide-react";
import { getDebts, createDebt, updateDebt, deleteDebt } from "../debts/debtApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import "../dashboard/Dashboard.css";

export default function KhataPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [name, setName] = useState("");
  const [direction, setDirection] = useState("owed_to_me");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);

  /* ── All API query & mutation logic preserved ── */
  const { data: debtsData, isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: getDebts,
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Entry added to Khata!");
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create entry."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDebt(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      if (variables.payload.settlement_status === "settled") {
        toast.success("Marked as Paid!");
      } else {
        toast("Marked as Pending", { icon: "⏳" });
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update entry."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("Entry deleted.");
      setItemToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete entry.");
      setItemToDelete(null);
    },
  });

  const confirmDelete = () => {
    if (itemToDelete) deleteMutation.mutate(itemToDelete);
  };

  const resetForm = () => {
    setName("");
    setDirection("owed_to_me");
    setAmount("");
    setDueDate("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a person's name.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    createMutation.mutate({
      counterparty_name: name.trim(),
      direction,
      amount: parsedAmount,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
  };

  const handleTogglePaid = (debt) => {
    const isPaid = debt.settlement_status === "settled";
    updateMutation.mutate({
      id: debt._id,
      payload: { settlement_status: isPaid ? "pending" : "settled" },
    });
  };

  const debts = debtsData?.debts || [];
  const pendingDebts = debts.filter(d => d.settlement_status === "pending");
  const settledDebts = debts.filter(d => d.settlement_status === "settled");
  const totalOwedToMe = pendingDebts.filter(d => d.direction === "owed_to_me").reduce((s, d) => s + (d.amount || 0), 0);
  const totalIOwe = pendingDebts.filter(d => d.direction === "i_owe").reduce((s, d) => s + (d.amount || 0), 0);
  const netBalance = totalOwedToMe - totalIOwe;

  const filteredDebts = debts.filter(d => {
    if (filter === "pending") return d.settlement_status === "pending";
    if (filter === "settled") return d.settlement_status === "settled";
    if (filter === "lent") return d.direction === "owed_to_me";
    if (filter === "borrowed") return d.direction === "i_owe";
    return true;
  });

  const filterTabs = [
    { key: "all", label: `All (${debts.length})` },
    { key: "pending", label: `Pending (${pendingDebts.length})` },
    { key: "settled", label: `Paid (${settledDebts.length})` },
    { key: "lent", label: "Lent" },
    { key: "borrowed", label: "Borrowed" },
  ];

  return (
    <div className="dash-root">
      {/* ── PAGE HEADER ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Khata & IOUs</h1>
          <p className="dash-page-desc">Track money you lent to friends and money you owe.</p>
        </div>
        <div className="dash-page-actions">
          <button onClick={() => setModalOpen(true)} className="dash-btn-primary">
            <Plus size={16} />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS ── */}
      <div className="dash-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Owed to You</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-emerald-soft)", color: "var(--dash-emerald)" }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "var(--dash-emerald)" }}>
            ${totalOwedToMe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="dash-kpi-hint">
            {pendingDebts.filter(d => d.direction === "owed_to_me").length} person(s) owe you
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">You Owe</span>
            <div className="dash-kpi-icon-box" style={{ background: "var(--dash-danger-soft)", color: "var(--dash-danger)" }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "var(--dash-danger)" }}>
            ${totalIOwe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="dash-kpi-hint">
            {pendingDebts.filter(d => d.direction === "i_owe").length} person(s) to repay
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Net Balance</span>
            <div className="dash-kpi-icon-box" style={{
              background: netBalance >= 0 ? "var(--dash-emerald-soft)" : "var(--dash-danger-soft)",
              color: netBalance >= 0 ? "var(--dash-emerald)" : "var(--dash-danger)",
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: netBalance >= 0 ? "var(--dash-emerald)" : "var(--dash-danger)" }}>
            {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="dash-kpi-hint">{netBalance >= 0 ? "Overall positive position" : "You have more debts to pay"}</div>
        </div>
      </div>

      {/* ── FILTER PILL TABS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "var(--dash-muted)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, marginRight: "4px" }}>
          <Filter size={13} /> Filter:
        </span>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "7px 16px",
              borderRadius: "9999px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: filter === tab.key ? 700 : 500,
              background: filter === tab.key ? "var(--dash-blue)" : "#ffffff",
              color: filter === tab.key ? "#ffffff" : "var(--dash-muted)",
              border: `1px solid ${filter === tab.key ? "var(--dash-blue)" : "var(--dash-border)"}`,
              transition: "all 0.15s ease",
              boxShadow: filter === tab.key ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
              fontFamily: "var(--dash-font)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LEDGER LIST CARD ── */}
      <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--dash-muted)", fontSize: "14px" }}>
            <span style={{
              width: 20,
              height: 20,
              border: "2px solid var(--dash-border)",
              borderTopColor: "var(--dash-blue)",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }} />
            Loading entries...
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="dash-empty-box" style={{ padding: "50px 20px" }}>
            <div className="dash-empty-icon" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
              <CheckCircle2 size={24} />
            </div>
            <p className="dash-empty-title">No entries yet</p>
            <p className="dash-empty-desc">You have no active or settled peer records under this filter.</p>
            <button onClick={() => setModalOpen(true)} className="dash-btn-primary" style={{ marginTop: "14px" }}>
              <Plus size={15} />
              <span>Add Entry</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredDebts.map((debt, i) => {
              const isPaid = debt.settlement_status === "settled";
              const isLent = debt.direction === "owed_to_me";
              return (
                <div
                  key={debt._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    padding: "16px 20px",
                    background: isPaid ? "var(--dash-alt-bg)" : "#ffffff",
                    borderBottom: i < filteredDebts.length - 1 ? "1px solid var(--dash-border)" : "none",
                    opacity: isPaid ? 0.7 : 1,
                    transition: "background 0.12s ease",
                  }}
                >
                  {/* Left info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                    {/* Paid check button */}
                    <button
                      onClick={() => handleTogglePaid(debt)}
                      title={isPaid ? "Mark as Pending" : "Mark as Paid"}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        flexShrink: 0,
                        cursor: "pointer",
                        border: `1.5px solid ${isPaid ? "var(--dash-emerald)" : "var(--dash-border)"}`,
                        background: isPaid ? "var(--dash-emerald)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isPaid && <Check size={14} color="#ffffff" strokeWidth={3} />}
                    </button>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "var(--dash-foreground)",
                          textDecoration: isPaid ? "line-through" : "none",
                        }}>
                          {debt.counterparty_name}
                        </span>
                        {/* Direction badge */}
                        <span style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: "9999px",
                          background: isLent ? "var(--dash-emerald-soft)" : "var(--dash-blue-soft)",
                          color: isLent ? "var(--dash-emerald)" : "var(--dash-blue)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {isLent ? "You Lent" : "You Borrowed"}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
                        {isPaid ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--dash-emerald)" }}>
                            <Check size={11} strokeWidth={3} /> Paid
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "var(--dash-amber)" }}>
                            <AlertTriangle size={11} /> Pending
                          </span>
                        )}
                        {debt.due_date && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "var(--dash-muted)", fontWeight: 500 }}>
                            <Calendar size={12} />
                            Due: {new Date(debt.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
                    <span style={{
                      fontSize: "15.5px",
                      fontWeight: 800,
                      color: isPaid ? "var(--dash-muted)" : isLent ? "var(--dash-emerald)" : "var(--dash-danger)",
                      textDecoration: isPaid ? "line-through" : "none",
                    }}>
                      {isLent ? "+" : "-"}${Number(debt.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => setItemToDelete(debt._id)}
                      className="dash-action-btn delete"
                      title="Delete Entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD ENTRY MODAL ── */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
              <motion.div
                key="khata-bd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)", zIndex: -1 }}
              />
              <motion.div
                key="khata-modal"
                initial={{ scale: 0.95, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="dash-card"
                style={{
                  width: "100%",
                  maxWidth: "440px",
                  padding: "24px",
                  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.16)",
                  zIndex: 51,
                }}
              >
                {/* Modal Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid var(--dash-border)" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--dash-foreground)", margin: 0, letterSpacing: "-0.02em" }}>
                      New Khata Entry
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "2px 0 0" }}>Record money lent or borrowed</p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "1px solid var(--dash-border)",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--dash-muted)",
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Direction switcher */}
                  <div>
                    <label className="dash-form-label">Type of Entry</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "4px", background: "var(--dash-alt-bg)", borderRadius: "12px", border: "1px solid var(--dash-border)" }}>
                      {[
                        { val: "owed_to_me", label: "I Lent Money", icon: <ArrowUpRight size={14} /> },
                        { val: "i_owe", label: "I Borrowed", icon: <ArrowDownRight size={14} /> },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setDirection(opt.val)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "9px 0",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: direction === opt.val ? "#ffffff" : "transparent",
                            color: direction === opt.val ? "var(--dash-blue)" : "var(--dash-muted)",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: 700,
                            boxShadow: direction === opt.val ? "0 2px 6px rgba(15, 23, 42, 0.06)" : "none",
                            transition: "all 0.15s ease",
                            fontFamily: "var(--dash-font)",
                          }}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Person name */}
                  <div>
                    <label className="dash-form-label">Person's Name</label>
                    <div style={{ position: "relative" }}>
                      <User size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--dash-muted)" }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex, Roommate Ali"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="dash-input"
                        style={{ paddingLeft: "38px" }}
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="dash-form-label">Amount ($)</label>
                    <div style={{ position: "relative" }}>
                      <DollarSign size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--dash-muted)" }} />
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="dash-input"
                        style={{ paddingLeft: "38px", fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="dash-form-label">
                      Due Date <span style={{ fontWeight: 400, color: "var(--dash-muted)", textTransform: "none" }}>(optional)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Calendar size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--dash-muted)" }} />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="dash-input"
                        style={{ paddingLeft: "38px" }}
                      />
                    </div>
                  </div>

                  {/* Modal action buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
                    <button type="button" onClick={() => setModalOpen(false)} className="dash-btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={createMutation.isPending} className="dash-btn-primary">
                      {createMutation.isPending ? "Saving..." : "Save Entry"}
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
        title="Delete Khata Entry"
        message="Are you sure you want to remove this ledger entry?"
        confirmText="Delete"
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
