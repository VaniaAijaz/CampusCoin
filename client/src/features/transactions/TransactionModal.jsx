import { useState, useEffect } from "react";
import { X, Plus, Sparkles, AlertCircle, Calendar, Tag, DollarSign, Repeat } from "lucide-react";
import { createTransaction, updateTransaction, aiCategorizeDescription } from "./transactionApi";
import { getCategories } from "../categories/categoryApi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TransactionModal({
  isOpen,
  onClose,
  editTransaction = null,
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [categories, setCategories] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [fetchingCats, setFetchingCats] = useState(false);

  // Load categories matching current type
  useEffect(() => {
    if (!isOpen) return;
    const loadCategories = async () => {
      setFetchingCats(true);
      try {
        const res = await getCategories(type);
        if (res.success) {
          setCategories(res.categories);
          if (!editTransaction && res.categories.length > 0) {
            setCategoryId(res.categories[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setFetchingCats(false);
      }
    };
    loadCategories();
  }, [isOpen, type, editTransaction]);

  // Populate form if in edit mode
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setCategoryId(editTransaction.categoryId?._id || editTransaction.categoryId || "");
      setDescription(editTransaction.description || "");
      setDate(
        editTransaction.date
          ? new Date(editTransaction.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setIsRecurring(editTransaction.isRecurring || false);
      setRecurringFrequency(editTransaction.recurringFrequency || "monthly");
      setAiSuggestion(null);
    } else {
      setType("expense");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setRecurringFrequency("monthly");
      setAiSuggestion(null);
    }
  }, [editTransaction, isOpen]);

  // AI categorization watcher on description typing
  useEffect(() => {
    if (editTransaction || !description.trim() || description.length < 3) {
      setAiSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await aiCategorizeDescription(description);
        if (res.success && res.suggestion) {
          const matched = categories.find(
            (c) => c.name.toLowerCase() === res.suggestion.toLowerCase()
          );
          if (matched && matched._id !== categoryId) {
            setAiSuggestion({ name: res.suggestion, id: matched._id });
          }
        }
      } catch {
        // Silent fail for AI helper
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [description, categories, categoryId, editTransaction]);

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setCategoryId(aiSuggestion.id);
      setAiSuggestion(null);
      toast.success(`Category updated to "${aiSuggestion.name}" by AI`);
    }
  };

  const transactionMutation = useMutation({
    mutationFn: async (payload) => {
      if (editTransaction) {
        return await updateTransaction(editTransaction._id, payload);
      }
      return await createTransaction(payload);
    },
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ["dashboardData"] });
      const previousData = queryClient.getQueryData(["dashboardData"]);

      // Optimistically update dashboard UI
      queryClient.setQueryData(["dashboardData"], (old) => {
        if (!old) return old;
        const updated = { ...old };
        const amt = parseFloat(newTx.amount);
        
        if (updated.metrics?.currentMonth) {
          if (newTx.type === "income") {
            updated.metrics.currentMonth.income += amt;
            updated.metrics.currentMonth.netSavings += amt;
          } else {
            updated.metrics.currentMonth.expense += amt;
            updated.metrics.currentMonth.netSavings -= amt;
          }
        }
        
        if (newTx.type === "expense" && updated.budgets) {
          updated.budgets = updated.budgets.map(b => {
            if ((b.categoryId?._id || b.categoryId) === newTx.categoryId) {
              return { ...b, spentAmount: (b.spentAmount || 0) + amt };
            }
            return b;
          });
        }
        
        return updated;
      });

      return { previousData };
    },
    onError: (err, newTx, context) => {
      queryClient.setQueryData(["dashboardData"], context.previousData);
      toast.error(err.response?.data?.message || "Failed to save transaction.");
    },
    onSuccess: (res) => {
      if (!editTransaction && res.flags && res.flags.length > 0) {
        toast((t) => (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs">Logged with Notice:</p>
              <p className="text-xs text-zinc-300">{res.flags[0]}</p>
            </div>
          </div>
        ), { duration: 4000 });
      } else {
        toast.success(`Transaction ${editTransaction ? 'updated' : 'logged'} successfully!`);
      }
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      onClose();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    const payload = {
      type,
      amount: parseFloat(amount),
      categoryId,
      description: description.trim(),
      date: new Date(date).toISOString(),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
    };

    transactionMutation.mutate(payload);
  };

  const loading = transactionMutation.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-[6px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="w-full max-w-lg bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 relative overflow-hidden text-white max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-2 rounded-[16px] bg-white/15 border border-white/25 text-sky-300">
                <DollarSign className="w-4 h-4" />
              </span>
              {editTransaction ? "Edit Transaction" : "Quick Add Transaction"}
            </h3>
            <p className="text-xs text-white/70 mt-0.5 font-medium">
              Log student income or expenses with instant category tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer min-h-[32px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 p-1 rounded-full bg-white/10 border border-white/20">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                type === "expense"
                  ? "bg-rose-500/30 text-rose-200 border border-rose-400/40 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                type === "income"
                  ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount input & Quick Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">
              Amount ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-black text-sm">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-[16px] bg-white/10 border border-white/25 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/60 transition-colors min-h-[44px]"
              />
            </div>
            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[5, 10, 20, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-3.5 py-1 text-xs font-semibold rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 transition-colors cursor-pointer min-h-[32px] flex items-center"
                >
                  +${val}
                </button>
              ))}
            </div>
          </div>

          {/* Description & AI Autocategorization notice */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5">
              Description / Merchant
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Campus cafe iced mocha, transit card, books"
              className="w-full px-4 py-3 rounded-[16px] bg-white/10 border border-white/25 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/60 transition-colors min-h-[44px]"
            />
            {aiSuggestion && (
              <div className="mt-2 p-3 rounded-[16px] bg-white/15 border border-white/25 flex items-center justify-between text-xs text-white">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Suggested: <strong className="text-white">{aiSuggestion.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="px-3 py-1 rounded-full bg-white/25 text-white font-bold text-xs hover:bg-white/35 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-white/70" />
              Category
            </label>
            {fetchingCats ? (
              <div className="py-2.5 text-xs text-white/50 animate-pulse">Loading categories...</div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-[16px] bg-white/10 border border-white/25 text-white text-sm focus:outline-none focus:border-white/60 cursor-pointer min-h-[44px]"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id} className="bg-slate-900 text-white">
                    {c.name} {c.isDefault ? "(Standard)" : "(Custom)"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/80 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/70" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-white/10 border border-white/25 text-white text-sm focus:outline-none focus:border-white/60 min-h-[44px]"
            />
          </div>

          {/* Recurring Toggle */}
          <div className="p-3.5 rounded-[16px] bg-white/10 border border-white/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/90 flex items-center gap-2 cursor-pointer">
                <Repeat className="w-4 h-4 text-sky-300" />
                Recurring Student Expense / Income
              </label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-sky-400 bg-white/20 border-white/30 cursor-pointer"
              />
            </div>
            {isRecurring && (
              <div className="pt-2">
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] bg-white/15 border border-white/25 text-xs text-white"
                >
                  <option value="weekly" className="bg-slate-900">Weekly (e.g. Allowance, Transit)</option>
                  <option value="monthly" className="bg-slate-900">Monthly (e.g. Rent, Subscriptions)</option>
                  <option value="yearly" className="bg-slate-900">Yearly (e.g. Tuition, Union Fee)</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit & Cancel Buttons with >= 44px touch target */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{loading ? "Saving..." : editTransaction ? "Update Record" : "Save Transaction"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
