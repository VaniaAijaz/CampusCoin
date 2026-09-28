import { useState, useEffect } from "react";
import { X, Plus, AlertCircle, Calendar, Tag, Repeat, CreditCard, Banknote, FolderPlus, Smartphone } from "lucide-react";
import { createTransaction, updateTransaction } from "./transactionApi";
import { getCategories, createCategory } from "../categories/categoryApi";
import { createSubscription } from "../subscriptions/subscriptionApi";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency, getCurrencySymbol } from "../../utils/currencyUtils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Portal from "../../components/ui/Portal";
import "../dashboard/Dashboard.css";

export default function TransactionModal({ isOpen, onClose, editTransaction = null }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Digital Bank");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [subscriptionName, setSubscriptionName] = useState("");
  const [categories, setCategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const cur = user?.currency || "USD";
  const currencySymbol = getCurrencySymbol(cur);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setFetchingCats(true);
      try {
        const res = await getCategories(type);
        if (res.success) {
          setCategories(res.categories || []);
          if (!editTransaction && res.categories?.length > 0) setCategoryId(res.categories[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingCats(false);
      }
    };
    load();
  }, [isOpen, type, editTransaction]);

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type || "expense");
      setAmount(editTransaction.amount?.toString() || "");
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
      setSubscriptionName("");
    }
  }, [editTransaction, isOpen]);

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
        color: type === "income" ? "#16a34a" : "#2563eb",
      });
      if (res.success && res.category) {
        setCategories((p) => [res.category, ...p]);
        setCategoryId(res.category._id);
        setShowAddCat(false);
        setNewCatName("");
        toast.success(`Category "${res.category.name}" created!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category.");
    } finally {
      setAddingCat(false);
    }
  };

  const transactionMutation = useMutation({
    mutationFn: async (payload) => {
      const res = editTransaction ? await updateTransaction(editTransaction._id, payload) : await createTransaction(payload);
      
      // Auto-create a subscription if the category is 'Subscription' and a name is provided
      const isSubscription = categories.find((c) => c._id === payload.categoryId)?.name?.toLowerCase() === "subscription";
      if (!editTransaction && isSubscription && type === "expense" && subscriptionName.trim()) {
        try {
          await createSubscription({
            name: subscriptionName.trim(),
            amount: payload.amount,
            billing_cycle: payload.isRecurring ? payload.recurringFrequency : "monthly",
            renewal_date: payload.date,
          });
        } catch (err) {
          console.error("Failed to auto-create subscription:", err);
        }
      }
      
      return res;
    },
    onMutate: async (newTx) => {
      await queryClient.cancelQueries({ queryKey: ["dashboardData"] });
      const previousData = queryClient.getQueryData(["dashboardData"]);
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
          updated.budgets = updated.budgets.map((b) =>
            (b.categoryId?._id || b.categoryId) === newTx.categoryId
              ? { ...b, spentAmount: (b.spentAmount || 0) + amt }
              : b
          );
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
      if (!editTransaction && res.flags?.length > 0) {
        toast(
          () => (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <AlertCircle style={{ width: 18, color: "#f59e0b", flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>Notice:</p>
                <p style={{ fontSize: 12, margin: 0, opacity: 0.8 }}>{res.flags[0]}</p>
              </div>
            </div>
          ),
          { duration: 4000 }
        );
      } else {
        toast.success(`Transaction ${editTransaction ? "updated" : "saved"}!`);
      }
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!categoryId) {
      toast.error("Please choose a category.");
      return;
    }
    transactionMutation.mutate({
      type,
      amount: parsedAmount,
      paymentMethod,
      categoryId,
      description: description.trim(),
      date: new Date(date).toISOString(),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
    });
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
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(6px)",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="dash-card"
              style={{
                width: "100%",
                maxWidth: 480,
                padding: 0,
                overflow: "hidden",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: "20px 24px 16px",
                  borderBottom: "1px solid rgba(172, 217, 251, 0.45)",
                  background: "linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(219, 234, 254, 0.5) 100%)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#2563eb" }}>
                      Transaction Entry
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>
                      {editTransaction ? "Edit Transaction" : "Record New Transaction"}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid rgba(226, 232, 240, 0.9)",
                      background: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Segmented Type Switcher */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                    marginTop: 14,
                    padding: 4,
                    background: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 12,
                    border: "1px solid rgba(191, 219, 254, 0.8)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    style={{
                      padding: "8px 0",
                      borderRadius: 9,
                      cursor: "pointer",
                      background: type === "expense" ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "transparent",
                      color: type === "expense" ? "#ffffff" : "#475569",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: type === "expense" ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🔴 Expense (Spent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    style={{
                      padding: "8px 0",
                      borderRadius: 9,
                      cursor: "pointer",
                      background: type === "income" ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" : "transparent",
                      color: type === "income" ? "#ffffff" : "#475569",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: type === "income" ? "0 2px 8px rgba(22,163,74,0.3)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🟢 Income (Received)
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
                {/* Amount Input */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    Amount ({currencySymbol})
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ position: "absolute", left: 14, color: "#2563eb", fontWeight: 800, fontSize: 16 }}>
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="dash-input"
                      style={{ paddingLeft: 42, fontSize: 16, fontWeight: 700 }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Category</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCat(!showAddCat)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#2563eb",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={13} />
                      <span>{showAddCat ? "Cancel" : "+ New Category"}</span>
                    </button>
                  </div>

                  {showAddCat && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="New category name..."
                        className="dash-input"
                        style={{ height: 38, fontSize: 13 }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewCategory}
                        disabled={addingCat}
                        className="dash-btn-primary"
                        style={{ height: 38, padding: "0 14px", fontSize: 12 }}
                      >
                        {addingCat ? "Adding..." : "Save"}
                      </button>
                    </div>
                  )}

                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="dash-select"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subscription Name Input */}
                {categories.find((c) => c._id === categoryId)?.name?.toLowerCase() === "subscription" && type === "expense" && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                      Subscription Name
                    </label>
                    <input
                      type="text"
                      value={subscriptionName}
                      onChange={(e) => setSubscriptionName(e.target.value)}
                      placeholder="e.g. Netflix, Gym, Spotify"
                      className="dash-input"
                    />
                  </div>
                )}

                {/* Description Input */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    Description / Note
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={type === "expense" ? "e.g. Lunch with friends, Course books" : "e.g. Monthly allowance, Freelance payout"}
                    className="dash-input"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    Payment Method
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {[
                      ["Digital Bank", <CreditCard key="card" size={13} />],
                      ["Cash", <Banknote key="cash" size={13} />],
                      ["Mobile Wallet", <Smartphone key="phone" size={13} />],
                    ].map(([val, icon]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPaymentMethod(val)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          padding: "8px 4px",
                          borderRadius: 9,
                          cursor: "pointer",
                          background: paymentMethod === val ? "#eff6ff" : "#f8fafc",
                          color: paymentMethod === val ? "#2563eb" : "#475569",
                          border: `1px solid ${paymentMethod === val ? "#93c5fd" : "#e2e8f0"}`,
                          fontSize: 12,
                          fontWeight: paymentMethod === val ? 700 : 500,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {icon}
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="dash-input"
                  />
                </div>

                {/* Recurring Toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Repeat size={15} style={{ color: "#2563eb" }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>Recurring Monthly?</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#2563eb" }}
                  />
                </div>

                {/* Submit Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={onClose}
                    className="dash-btn-secondary"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="dash-btn-primary"
                    style={{ flex: 2, justifyContent: "center" }}
                  >
                    {loading ? "Saving..." : editTransaction ? "Update Transaction" : "Save Transaction"}
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
