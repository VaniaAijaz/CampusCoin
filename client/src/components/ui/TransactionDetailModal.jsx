import { motion } from "framer-motion";
import {
  X,
  Copy,
  Check,
  CheckCircle2,
  Utensils,
  Building2,
  Car,
  GraduationCap,
  ShoppingBag,
  HeartPulse,
  Gamepad2,
  Wallet,
  Tag,
  CreditCard,
  Banknote,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

/**
 * Dynamic Category Icon Resolver
 */
function getCategoryIcon(categoryName = "") {
  const name = categoryName.toLowerCase();
  if (name.includes("food") || name.includes("dining") || name.includes("meal") || name.includes("grocery") || name.includes("cafe")) {
    return { icon: Utensils, bg: "bg-amber-500/20 text-amber-400 border-amber-400/30" };
  }
  if (name.includes("hostel") || name.includes("rent") || name.includes("housing") || name.includes("room") || name.includes("dorm")) {
    return { icon: Building2, bg: "bg-indigo-500/20 text-indigo-400 border-indigo-400/30" };
  }
  if (name.includes("transit") || name.includes("transport") || name.includes("bus") || name.includes("uber") || name.includes("metro")) {
    return { icon: Car, bg: "bg-sky-500/20 text-sky-400 border-sky-400/30" };
  }
  if (name.includes("tuition") || name.includes("book") || name.includes("course") || name.includes("study") || name.includes("education")) {
    return { icon: GraduationCap, bg: "bg-purple-500/20 text-purple-400 border-purple-400/30" };
  }
  if (name.includes("shopping") || name.includes("cloth") || name.includes("gear") || name.includes("supplies")) {
    return { icon: ShoppingBag, bg: "bg-pink-500/20 text-pink-400 border-pink-400/30" };
  }
  if (name.includes("health") || name.includes("medical") || name.includes("pharmacy") || name.includes("doctor")) {
    return { icon: HeartPulse, bg: "bg-rose-500/20 text-rose-400 border-rose-400/30" };
  }
  if (name.includes("fun") || name.includes("entertain") || name.includes("game") || name.includes("movie") || name.includes("party")) {
    return { icon: Gamepad2, bg: "bg-emerald-500/20 text-emerald-400 border-emerald-400/30" };
  }
  if (name.includes("salary") || name.includes("allowance") || name.includes("stipend") || name.includes("freelance")) {
    return { icon: Wallet, bg: "bg-emerald-500/20 text-emerald-400 border-emerald-400/30" };
  }
  return { icon: Tag, bg: "bg-slate-500/20 text-slate-300 border-slate-400/30" };
}

export default function TransactionDetailModal({ tx, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!tx) return null;

  const isIncome = tx.type === "income";
  const categoryName = tx.categoryId?.name || "General";
  const { icon: CatIcon, bg: iconStyle } = getCategoryIcon(categoryName);
  
  // Format transactionId or generate fallback based on _id
  const txnId = tx.transactionId || `TXN-${(tx._id || "847291").slice(-6).toUpperCase()}`;
  const paymentMethod = tx.paymentMethod || "Digital Bank";
  const isCash = paymentMethod === "Cash";

  const handleCopyId = () => {
    navigator.clipboard.writeText(txnId);
    setCopied(true);
    toast.success("Transaction ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const txDate = tx.date ? new Date(tx.date) : new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md -z-10"
      />

      {/* Physical Glass Receipt Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="w-full max-w-sm sm:max-w-md bg-[#080B10]/95 backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-6 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] text-white flex flex-col gap-5 relative overflow-hidden transform-gpu backface-hidden"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-white/50">Receipt</span>
            <span className="text-white/20">•</span>
            <span className="text-xs font-mono text-white/70">{txnId}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Central Category Icon & Amount Hero */}
        <div className="flex flex-col items-center justify-center text-center py-2 relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg mb-3 ${iconStyle}`}>
            <CatIcon className="w-8 h-8" />
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`text-4xl sm:text-5xl font-black tracking-tight ${isIncome ? "text-emerald-400" : "text-white"}`}>
              {isIncome ? "+" : "-"}${Number(tx.amount || 0).toFixed(2)}
            </span>
          </div>

          {/* Payment Method Badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isCash
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
            }`}>
              {isCash ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
              {paymentMethod}
            </span>

            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isIncome
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
            }`}>
              {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {isIncome ? "Incoming Flow" : "Expense Outflow"}
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-[64px] border border-white/10 border-t-white/20 border-l-white/20 p-4 space-y-3.5 text-xs relative z-10">
          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-white/60">Category</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              {categoryName}
            </span>
          </div>

          {/* Description / Note */}
          <div className="flex items-start justify-between gap-4">
            <span className="text-white/60 shrink-0">Description</span>
            <span className="font-semibold text-white text-right max-w-[200px] break-words">
              {tx.description || <span className="text-white/40 italic">No notes provided</span>}
            </span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-white/40" /> Date
            </span>
            <span className="font-medium text-white/90">
              {txDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white/60 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-white/40" /> Time
            </span>
            <span className="font-medium text-white/90">
              {txDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Unique Transaction ID with Copy Button */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-white/60">Transaction ID</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-xs transition-colors cursor-pointer"
              title="Copy ID"
            >
              <span>{txnId}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
            </button>
          </div>

          {/* Verification Status */}
          <div className="flex items-center justify-between">
            <span className="text-white/60">Ledger Status</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Settled & Cleared
            </span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 pt-1 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer text-center"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
