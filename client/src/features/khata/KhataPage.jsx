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

/* ── exact landing page tokens ── */
const C = {
  hero:        "oklch(0.115 0.018 255)",
  heroFg:      "oklch(0.985 0.003 250)",
  heroMuted:   "oklch(0.73 0.018 252)",
  heroLine:    "oklch(0.31 0.025 255)",
  brand:       "oklch(0.59 0.22 262)",
  brandSoft:   "oklch(0.93 0.06 262)",
  highlight:   "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth:      "oklch(0.64 0.17 157)",
  growthSoft:  "oklch(0.94 0.05 158)",
  background:  "oklch(0.99 0.003 250)",
  foreground:  "oklch(0.16 0.025 260)",
  muted:       "oklch(0.5 0.025 255)",
  border:      "oklch(0.9 0.012 255)",
  altBg:       "oklch(0.965 0.01 254)",
};
const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };

const inputStyle = {
  width: "100%", padding: "10px 14px 10px 38px",
  borderRadius: 999, background: C.altBg,
  border: `1.5px solid ${C.border}`,
  fontSize: 13, color: C.foreground, outline: "none",
  fontFamily: M.fontFamily, transition: "border-color 0.15s",
  boxSizing: "border-box",
};

export default function KhataPage() {
  const queryClient = useQueryClient();
  const [modalOpen,    setModalOpen]    = useState(false);
  const [filter,       setFilter]       = useState("all");
  const [name,         setName]         = useState("");
  const [direction,    setDirection]    = useState("owed_to_me");
  const [amount,       setAmount]       = useState("");
  const [dueDate,      setDueDate]      = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);

  /* ── all logic exactly preserved ── */
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
      if (variables.payload.settlement_status === "settled") toast.success("Marked as Paid!");
      else toast("Marked as Pending / Not Paid", { icon: "⏳" });
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

  const confirmDelete = () => { if (itemToDelete) deleteMutation.mutate(itemToDelete); };

  const resetForm = () => { setName(""); setDirection("owed_to_me"); setAmount(""); setDueDate(""); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter the person's name."); return; }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { toast.error("Please enter a valid amount."); return; }
    createMutation.mutate({
      counterparty_name: name.trim(), direction, amount: parsedAmount,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
  };

  const handleTogglePaid = (debt) => {
    const isPaid = debt.settlement_status === "settled";
    updateMutation.mutate({ id: debt._id, payload: { settlement_status: isPaid ? "pending" : "settled" } });
  };

  const debts         = debtsData?.debts || [];
  const pendingDebts  = debts.filter(d => d.settlement_status === "pending");
  const settledDebts  = debts.filter(d => d.settlement_status === "settled");
  const totalOwedToMe = pendingDebts.filter(d => d.direction === "owed_to_me").reduce((s, d) => s + (d.amount || 0), 0);
  const totalIOwe     = pendingDebts.filter(d => d.direction === "i_owe").reduce((s, d) => s + (d.amount || 0), 0);
  const netBalance    = totalOwedToMe - totalIOwe;

  const filteredDebts = debts.filter(d => {
    if (filter === "pending")  return d.settlement_status === "pending";
    if (filter === "settled")  return d.settlement_status === "settled";
    if (filter === "lent")     return d.direction === "owed_to_me";
    if (filter === "borrowed") return d.direction === "i_owe";
    return true;
  });

  const filterTabs = [
    { key: "all",      label: `All (${debts.length})` },
    { key: "pending",  label: `Pending (${pendingDebts.length})` },
    { key: "settled",  label: `Paid (${settledDebts.length})` },
    { key: "lent",     label: "Lent" },
    { key: "borrowed", label: "Borrowed" },
  ];

  return (
    <div style={{ ...M, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: C.brand, margin: "0 0 6px" }}>
            Peer Ledger
          </p>
          <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 900, color: C.foreground, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Khata
          </h1>
          <p style={{ fontSize: 14, color: C.muted, margin: "6px 0 0", fontWeight: 500 }}>
            Track money lent to and borrowed from campus peers.
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          height: 42, padding: "0 22px", borderRadius: 999,
          background: C.highlight, color: C.highlightFg,
          border: "none", fontSize: 14, fontWeight: 800, cursor: "pointer", ...M,
          boxShadow: `0 4px 16px ${C.highlight}55`, transition: "background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "oklch(0.82 0.18 157)"}
          onMouseLeave={e => e.currentTarget.style.background = C.highlight}
        >
          <Plus style={{ width: 15 }} />
          Add Entry
        </button>
      </div>

      {/* ── SUMMARY STRIP — 3 cols, landing page bento style ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", background: C.border }}>
        {[
          { label: "Owed to You", value: totalOwedToMe, accent: C.growth, soft: C.growthSoft, icon: <ArrowUpRight style={{ width: 18 }} />, sub: `${pendingDebts.filter(d => d.direction === "owed_to_me").length} borrower(s)` },
          { label: "You Owe",     value: totalIOwe,     accent: C.brand,  soft: C.brandSoft,  icon: <ArrowDownRight style={{ width: 18 }} />, sub: `${pendingDebts.filter(d => d.direction === "i_owe").length} lender(s)` },
          { label: "Net Position", value: Math.abs(netBalance), accent: netBalance >= 0 ? C.growth : C.brand, soft: netBalance >= 0 ? C.growthSoft : C.brandSoft, icon: <Clock style={{ width: 18 }} />, sub: `${pendingDebts.length} active`, prefix: netBalance >= 0 ? "+" : "−" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", padding: "20px 22px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.soft, color: s.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              {s.icon}
            </div>
            <div style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, color: s.accent, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              {s.prefix || ""} ${s.value.toFixed(2)}
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{s.label}</p>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FILTER TABS — landing page tab style ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
          <Filter style={{ width: 12 }} /> Filter:
        </span>
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
            padding: "7px 16px", borderRadius: 999, cursor: "pointer",
            fontSize: 13, fontWeight: filter === tab.key ? 700 : 500,
            background: filter === tab.key ? C.hero : "#fff",
            color: filter === tab.key ? C.heroFg : C.muted,
            border: `1.5px solid ${filter === tab.key ? C.hero : C.border}`,
            transition: "all 0.15s", ...M,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LEDGER LIST ── */}
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: C.muted, fontSize: 14 }}>
            <span style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.brand, borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            Loading ledger...
          </div>
        ) : filteredDebts.length === 0 ? (
          <div style={{ padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.brandSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 style={{ width: 22, color: C.brand }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.foreground, margin: "0 0 6px" }}>No records found</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>All settled, or no peer entries logged yet.</p>
            </div>
            <button onClick={() => setModalOpen(true)} style={{
              display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 20px", borderRadius: 999,
              background: C.highlight, color: C.highlightFg, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", ...M,
            }}>
              <Plus style={{ width: 13 }} /> Add First Record
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {filteredDebts.map((debt, i) => {
              const isPaid = debt.settlement_status === "settled";
              const isLent = debt.direction === "owed_to_me";
              return (
                <div key={debt._id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "14px 20px",
                  background: isPaid ? C.altBg : "#fff",
                  borderBottom: i < filteredDebts.length - 1 ? `1px solid ${C.border}` : "none",
                  opacity: isPaid ? 0.65 : 1,
                  transition: "background 0.12s",
                }}>
                  {/* Left */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    {/* Toggle paid checkbox */}
                    <button onClick={() => handleTogglePaid(debt)} style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0, cursor: "pointer",
                      border: `2px solid ${isPaid ? C.growth : C.border}`,
                      background: isPaid ? C.growth : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {isPaid && <Check style={{ width: 13, color: "#fff", strokeWidth: 3 }} />}
                    </button>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.foreground, textDecoration: isPaid ? "line-through" : "none" }}>
                          {debt.counterparty_name}
                        </span>
                        {/* Direction badge */}
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                          background: isLent ? C.growthSoft : C.brandSoft,
                          color: isLent ? C.growth : C.brand,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          {isLent ? "You Lent" : "You Borrowed"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        {isPaid ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: C.growth, background: C.growthSoft, padding: "2px 8px", borderRadius: 999 }}>
                            <Check style={{ width: 10, strokeWidth: 3 }} /> Paid
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "2px 8px", borderRadius: 999 }}>
                            <AlertTriangle style={{ width: 10 }} /> Pending
                          </span>
                        )}
                        {debt.due_date && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.muted, fontWeight: 500 }}>
                            <Calendar style={{ width: 11 }} />
                            Due: {new Date(debt.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: isPaid ? C.muted : isLent ? C.growth : C.brand, textDecoration: isPaid ? "line-through" : "none" }}>
                      {isLent ? "+" : "−"}${Number(debt.amount).toFixed(2)}
                    </span>
                    <button onClick={() => setItemToDelete(debt._id)} style={{
                      width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                      border: `1.5px solid ${C.border}`, background: "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: C.muted, transition: "all 0.12s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.growthSoft; e.currentTarget.style.color = C.growth; e.currentTarget.style.borderColor = C.growth; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
                    >
                      <Trash2 style={{ width: 12 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD ENTRY MODAL — landing page hero panel style ── */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <motion.div
                key="khata-bd"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setModalOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: -1 }}
              />
              <motion.div
                key="khata-modal"
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                style={{
                  width: "100%", maxWidth: 440,
                  background: "#fff", borderRadius: 16,
                  border: `1.5px solid ${C.border}`,
                  boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
                  padding: "28px 28px 24px", ...M,
                }}
              >
                {/* Modal header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: C.brand, margin: "0 0 4px" }}>Peer Ledger</p>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: C.foreground, margin: 0, letterSpacing: "-0.02em" }}>New Khata Entry</h3>
                  </div>
                  <button onClick={() => setModalOpen(false)} style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                    <X style={{ width: 14 }} />
                  </button>
                </div>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Direction switcher — landing page tab style */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                      Transaction Flow
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 4, background: C.altBg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                      {[
                        { val: "owed_to_me", label: "I Lent Money",  icon: <ArrowUpRight style={{ width: 13 }} /> },
                        { val: "i_owe",      label: "I Borrowed",    icon: <ArrowDownRight style={{ width: 13 }} /> },
                      ].map(opt => (
                        <button key={opt.val} type="button" onClick={() => setDirection(opt.val)} style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "9px 0", borderRadius: 8, cursor: "pointer",
                          background: direction === opt.val ? C.hero : "transparent",
                          color: direction === opt.val ? C.heroFg : C.muted,
                          border: "none", fontSize: 13, fontWeight: 700, ...M,
                          transition: "all 0.15s",
                        }}>
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                      Person's Name
                    </label>
                    <div style={{ position: "relative" }}>
                      <User style={{ width: 14, position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                      <input type="text" required placeholder="e.g. Sarah, Roommate Ali" value={name} onChange={e => setName(e.target.value)}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = C.brand}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                      Amount
                    </label>
                    <div style={{ position: "relative" }}>
                      <DollarSign style={{ width: 14, position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                      <input type="number" step="any" min="0.01" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                        style={{ ...inputStyle, fontWeight: 700 }}
                        onFocus={e => e.target.style.borderColor = C.brand}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  </div>

                  {/* Due date */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                      Due Date <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Calendar style={{ width: 14, position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = C.brand}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                    <button type="button" onClick={() => setModalOpen(false)} style={{
                      padding: "11px 0", borderRadius: 999, cursor: "pointer",
                      background: "#fff", border: `1.5px solid ${C.border}`,
                      fontSize: 14, fontWeight: 600, color: C.muted, ...M,
                    }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={createMutation.isPending} style={{
                      padding: "11px 0", borderRadius: 999, cursor: "pointer",
                      background: C.highlight, color: C.highlightFg,
                      border: "none", fontSize: 14, fontWeight: 800, ...M,
                      opacity: createMutation.isPending ? 0.7 : 1,
                      boxShadow: `0 4px 14px ${C.highlight}55`,
                    }}>
                      {createMutation.isPending ? "Saving…" : "Save Record"}
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
