import { useState, useEffect } from "react";
import {
  X,
  Plus,
  AlertCircle,
  Calendar,
  Tag,
  DollarSign,
  Repeat,
  CreditCard,
  Banknote,
  FolderPlus,
} from "lucide-react";
import { createTransaction, updateTransaction } from "./transactionApi";
import { getCategories, createCategory } from "../categories/categoryApi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Portal from "../../components/ui/Portal";

export default function TransactionModal({
  isOpen,
  onClose,
  editTransaction = null,
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Digital Bank"); // "Cash" | "Digital Bank"
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [categories, setCategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(false);

  // Dynamic category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

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
      setAmount(editTransaction.amount ? editTransaction.amount.toString() : "");
      setPaymentMethod(editTransaction.paymentMethod || "Digital Bank");
      setCategoryId(editTransaction.categoryId?._id || editTransaction.categoryId || "");
      setDescription(editTransaction.description || "");
      setDate(
        editTransaction.date
          ? new Date(editTransaction.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setIsRecurring(editTransaction.isRecurring || false);
      setRecurringFrequency(editTransaction.recurringFrequency || "monthly");
      setShowAddCat(false);
    } else {
      setType("expense");
      setAmount("");
      setPaymentMethod("Digital Bank");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setRecurringFrequency("monthly");
      setShowAddCat(false);
      setNewCatName("");
    }
  }, [editTransaction, isOpen]);

  // Dynamic Category Handler
  const handleCreateNewCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    setAddingCat(true);
    try {
      const res = await createCategory({
        name: newCatName.trim(),
        type,
        icon: "tag",
        color: type === "income" ? "#10B981" : "#38BDF8",
      });
      if (res.success && res.category) {
        setCategories((prev) => [res.category, ...prev]);
        setCategoryId(res.category._id);
        setShowAddCat(false);
        setNewCatName("");
        toast.success(`Category "${res.category.name}" created!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create custom category.");
    } finally {
      setAddingCat(false);
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
          updated.budgets = updated.budgets.map((b) => {
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
      queryClient.setQueryData(["dashboardData"], context?.previousData);
      toast.error(err.response?.data?.message || "Failed to save transaction.");
    },
    onSuccess: (res) => {
      if (!editTransaction && res.flags && res.flags.length > 0) {
        toast(
          (t) => (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Logged with Notice:</p>
                <p className="text-xs text-zinc-300">{res.flags[0]}</p>
              </div>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.success(`Transaction ${editTransaction ? "updated" : "logged"} successfully!`);
      }
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    const payload = {
      type,
      amount: parsedAmount,
      paymentMethod,
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
    <Portal>
      <AnimatePresence>
        {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#080B10]/95 backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white max-h-[90vh] overflow-y-auto transform-gpu backface-hidden"
            style={{ willChange: "transform, opacity" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-2 rounded-[16px] bg-white/10 border border-white/15 text-sky-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  {editTransaction ? "Edit Transaction" : "Log Transaction"}
                </h3>
                <p className="text-xs text-white/60 mt-0.5 font-medium">
                  Add student income or expenses with cash/digital tracking.
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
              <div className="grid grid-cols-2 p-1 rounded-full bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`py-2 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                    type === "expense"
                      ? "bg-rose-500/30 text-rose-200 border border-rose-400/30 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`py-2 text-xs font-bold rounded-full transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                    type === "income"
                      ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Payment Method Selector: Cash vs. Digital Bank */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/20 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Digital Bank")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === "Digital Bank"
                        ? "bg-sky-500/30 text-sky-200 border border-sky-400/40 shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Digital Bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Cash")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === "Cash"
                        ? "bg-amber-500/30 text-amber-200 border border-amber-400/40 shadow-sm"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>
                </div>
              </div>

              {/* Amount input & Quick Chips */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-black text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3 rounded-[16px] bg-black/20 border border-white/15 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/40 transition-colors min-h-[44px] font-bold"
                  />
                </div>
                {/* Quick Amount Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5, 10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      className="px-3 py-1 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 transition-colors cursor-pointer min-h-[30px] flex items-center"
                    >
                      +${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description / Merchant */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Description / Where Spent
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dining hall dinner, transit card, course books"
                  className="w-full px-4 py-3 rounded-[16px] bg-black/20 border border-white/15 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/40 transition-colors min-h-[44px]"
                />
              </div>

              {/* Category Selector + Dynamic Category Adder */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-white/60" />
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCat(!showAddCat)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>{showAddCat ? "Cancel" : "+ Add Custom"}</span>
                  </button>
                </div>

                {showAddCat ? (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/15 space-y-2.5">
                    <p className="text-[11px] text-white/70 font-medium">Create a new category dynamically:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g., Gym, Stationery, Project Supplies"
                        className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewCategory}
                        disabled={addingCat}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {addingCat ? "..." : "Add"}
                      </button>
                    </div>
                  </div>
                ) : fetchingCats ? (
                  <div className="py-2.5 text-xs text-white/50 animate-pulse">Loading categories...</div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-[16px] bg-black/20 border border-white/15 text-white text-sm focus:outline-none focus:border-white/40 cursor-pointer min-h-[44px]"
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-white/60" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-[16px] bg-black/20 border border-white/15 text-white text-sm focus:outline-none focus:border-white/40 cursor-pointer min-h-[44px]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 stroke-[3]" />
                  )}
                  <span>
                    {loading
                      ? "Recording..."
                      : editTransaction
                      ? "Update Transaction"
                      : "Save Transaction"}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </Portal>
  );
}
