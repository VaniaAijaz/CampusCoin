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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-full max-w-lg bg-brand-dark/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-primary text-brand-dark/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-brand-primary">
                <DollarSign className="w-4 h-4" />
              </span>
              {editTransaction ? "Edit Transaction" : "Quick Add Transaction"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Log income or expenses with instant category tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/50 border border-white/10">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-brand-coral/20 text-rose-300 border border-brand-coral/30 shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === "income"
                  ? "bg-brand-mint/20 text-emerald-300 border border-brand-mint/30 shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount input & Quick Chips */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Amount ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
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
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            {/* Quick Amount Pills */}
            <div className="flex gap-1.5 mt-2">
              {[5, 10, 20, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 transition-colors cursor-pointer"
                >
                  +${val}
                </button>
              ))}
            </div>
          </div>

          {/* Description & AI Autocategorization notice */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description / Merchant
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Campus cafe iced mocha, bus pass, textbook"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {aiSuggestion && (
              <div className="mt-2 p-2 rounded-lg bg-brand-primary text-brand-dark/10 border border-brand-primary/20 flex items-center justify-between text-xs text-brand-primary/80 animate-fadeIn">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Suggested: <strong className="text-white">{aiSuggestion.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="px-2 py-0.5 rounded bg-brand-primary text-brand-dark font-medium text-2xs hover:bg-brand-primary text-brand-dark transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-zinc-400" />
              Category
            </label>
            {fetchingCats ? (
              <div className="py-2.5 text-xs text-zinc-500 animate-pulse">Loading categories...</div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c._id} value={c._id} className="bg-brand-obsidian text-white">
                    {c.name} {c.isDefault ? "(Standard)" : "(Custom)"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Recurring Toggle */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer">
                <Repeat className="w-3.5 h-3.5 text-brand-primary" />
                Recurring Student Expense / Income
              </label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary bg-black/20 border-white/20 focus:ring-indigo-500/50 cursor-pointer"
              />
            </div>
            {isRecurring && (
              <div className="pt-2">
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 text-xs text-white"
                >
                  <option value="weekly" className="bg-brand-obsidian">Weekly (e.g. Allowance, Groceries)</option>
                  <option value="monthly" className="bg-brand-obsidian">Monthly (e.g. Rent, Subscriptions)</option>
                  <option value="yearly" className="bg-brand-obsidian">Yearly (e.g. Tuition, Student Union Fee)</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-brand-primary/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Saving..." : editTransaction ? "Update Record" : "Save Transaction"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
