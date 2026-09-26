import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  X,
  Clock,
  Filter,
} from "lucide-react";
import { getDebts, createDebt, updateDebt, deleteDebt } from "../debts/debtApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";

// Video-Accurate Physical Spatial Glass Standard Recipe
const glassCard =
  "base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white transform-gpu backface-hidden";

export default function KhataPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, settled, lent, borrowed
  const [name, setName] = useState("");
  const [direction, setDirection] = useState("owed_to_me"); // owed_to_me, i_owe
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);

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
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create entry.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDebt(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      if (variables.payload.settlement_status === "settled") {
        toast.success("Marked as Paid!");
      } else {
        toast("Marked as Pending / Not Paid", { icon: "⏳" });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update entry.");
    },
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
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete);
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
      toast.error("Please enter the person's name.");
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
      payload: {
        settlement_status: isPaid ? "pending" : "settled",
      },
    });
  };

  const debts = debtsData?.debts || [];

  // Summary Metrics
  const pendingDebts = debts.filter((d) => d.settlement_status === "pending");
  const settledDebts = debts.filter((d) => d.settlement_status === "settled");

  const totalOwedToMe = pendingDebts
    .filter((d) => d.direction === "owed_to_me")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const totalIOwe = pendingDebts
    .filter((d) => d.direction === "i_owe")
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const netBalance = totalOwedToMe - totalIOwe;

  // Filtered List
  const filteredDebts = debts.filter((d) => {
    if (filter === "pending") return d.settlement_status === "pending";
    if (filter === "settled") return d.settlement_status === "settled";
    if (filter === "lent") return d.direction === "owed_to_me";
    if (filter === "borrowed") return d.direction === "i_owe";
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-sky-400" />
            <span>Khata (Peer Ledger)</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Keep frictionless track of money lent to or borrowed from campus peers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Khata Entry</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Owed to You (Lent) */}
        <div className={`${glassCard} p-6 flex flex-col justify-between min-h-[130px]`}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              Owed to You (Lent)
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-sm">
              ${totalOwedToMe.toFixed(2)}
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              {pendingDebts.filter((d) => d.direction === "owed_to_me").length} pending borrower(s)
            </p>
          </div>
        </div>

        {/* You Owe (Borrowed) */}
        <div className={`${glassCard} p-6 flex flex-col justify-between min-h-[130px]`}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              You Owe (Borrowed)
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 drop-shadow-sm">
              ${totalIOwe.toFixed(2)}
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              {pendingDebts.filter((d) => d.direction === "i_owe").length} pending lender(s)
            </p>
          </div>
        </div>

        {/* Net Balance */}
        <div className={`${glassCard} p-6 flex flex-col justify-between min-h-[130px]`}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              Net Position
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl sm:text-3xl font-black drop-shadow-sm ${
                netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {netBalance >= 0 ? `+$${netBalance.toFixed(2)}` : `-$${Math.abs(netBalance).toFixed(2)}`}
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              {pendingDebts.length} total active khata debt(s)
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <span className="text-xs text-white/50 flex items-center gap-1 mr-2 font-medium">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { key: "all", label: `All (${debts.length})` },
          { key: "pending", label: `Pending (${pendingDebts.length})` },
          { key: "settled", label: `Paid (${settledDebts.length})` },
          { key: "lent", label: "Money Lent" },
          { key: "borrowed", label: "Money Borrowed" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              filter === tab.key
                ? "bg-white/20 text-white border border-white/30 shadow-sm"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ledger List */}
      <div className={`${glassCard} p-4 sm:p-6`}>
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-xs text-white/50">Loading ledger records...</p>
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-white">No Khata records found</p>
            <p className="text-xs text-white/50 mt-1 max-w-sm">
              All debts are settled, or you haven't logged any peer lending or borrowing yet.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-semibold text-white cursor-pointer active:scale-95 transition-all"
            >
              Add First Record
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDebts.map((debt) => {
              const isPaid = debt.settlement_status === "settled";
              const isLent = debt.direction === "owed_to_me";

              return (
                <div
                  key={debt._id}
                  className={`p-4 rounded-[20px] transition-all flex items-center justify-between gap-3 border ${
                    isPaid
                      ? "bg-white/[0.02] border-white/5 opacity-60"
                      : "bg-white/[0.06] hover:bg-white/[0.1] border-white/10"
                  }`}
                >
                  {/* Left: Checkbox + Name + Status Tag */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePaid(debt)}
                      title={isPaid ? "Mark as Not Paid" : "Mark as Paid"}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isPaid
                          ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm"
                          : "bg-black/20 border-white/30 hover:border-white text-transparent"
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm truncate ${
                            isPaid ? "line-through text-white/50" : "text-white"
                          }`}
                        >
                          {debt.counterparty_name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isLent
                              ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                              : "bg-rose-500/10 border-rose-400/20 text-rose-300"
                          }`}
                        >
                          {isLent ? "You Lent" : "You Borrowed"}
                        </span>
                      </div>

                      {/* Status Warnings / Indicators */}
                      <div className="flex items-center gap-2 mt-1">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold tracking-wide">
                            <Check className="w-3 h-3 stroke-[3]" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold tracking-wide animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Pending / Not Paid
                          </span>
                        )}

                        {debt.due_date && (
                          <span className="text-[10px] text-white/50 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-white/40" />
                            Due: {new Date(debt.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-base font-black ${
                          isPaid
                            ? "line-through text-white/40"
                            : isLent
                            ? "text-emerald-300"
                            : "text-rose-400"
                        }`}
                      >
                        {isLent ? "+" : "-"}${Number(debt.amount).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => setItemToDelete(debt._id)}
                      className="p-2 rounded-full hover:bg-white/15 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Khata Entry Modal */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="w-full max-w-md bg-white/[0.03] backdrop-blur-[64px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6 sm:p-8 text-white space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-400" />
                  New Khata Entry
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Direction Switcher */}
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                    Transaction Flow
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/30 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setDirection("owed_to_me")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        direction === "owed_to_me"
                          ? "bg-emerald-500 text-slate-950 shadow-md"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      I Lent Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("i_owe")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        direction === "i_owe"
                          ? "bg-rose-500 text-white shadow-md"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      I Borrowed
                    </button>
                  </div>
                </div>

                {/* Counterparty Name */}
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                    Person's Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah, Roommate Ali"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/20 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                    Amount ($ USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/20 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 font-bold"
                    />
                  </div>
                </div>

                {/* Due Date (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                    Due Date (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/20 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white/80 cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Saving..." : "Save Record"}
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
    </div>
  );
}
