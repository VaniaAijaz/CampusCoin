import { useState, useEffect } from "react";
import { X, Plus, AlertCircle, Calendar, Tag, DollarSign, Repeat, CreditCard, Banknote, FolderPlus } from "lucide-react";
import { createTransaction, updateTransaction } from "./transactionApi";
import { getCategories, createCategory } from "../categories/categoryApi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Portal from "../../components/ui/Portal";
import "../dashboard/Dashboard.css";

const C = {
  brand: "#2563eb",
  brandSoft: "#dbeafe",
  growth: "#16a34a",
  growthSoft: "#dcfce7",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  altBg: "#f8fafc",
};

export default function TransactionModal({ isOpen, onClose, editTransaction = null }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Digital Bank");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [categories, setCategories] = useState([]);
  const [fetchingCats, setFetchingCats] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setFetchingCats(true);
      try {
        const res = await getCategories(type);
        if (res.success) {
          setCategories(res.categories);
          if (!editTransaction && res.categories.length > 0) setCategoryId(res.categories[0]._id);
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
      setType(editTransaction.type);
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
    mutationFn: async (payload) =>
      editTransaction ? await updateTransaction(editTransaction._id, payload) : await createTransaction(payload),
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
          (t) => (
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
              alignItems: "flex-end",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(6px)",
              padding: 0,
            }}
            className="sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 480,
                background: "#ffffff",
                borderRadius: "24px 24px 0 0",
                boxShadow: "0 -8px 40px rgba(15, 23, 42, 0.18)",
                maxHeight: "92vh",
                overflowY: "auto",
                fontFamily: "var(--dash-font)",
              }}
              className="sm:rounded-[24px]"
            >
              {/* Top Drag Handle (Mobile) */}
              <div style={{ width: 36, height: 4, background: "#e2e8f0", borderRadius: 9999, margin: "12px auto 0" }} />

              {/* Modal Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #091227 0%, #0d1e44 100%)",
                  padding: "22px 24px 20px",
                  color: "#ffffff",
                  position: "relative",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#93c5fd", marginBottom: 2 }}>
                      Transaction Entry
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
                      {editTransaction ? "Edit Transaction" : "Add Transaction"}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
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
                    marginTop: 16,
                    padding: 4,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    style={{
                      padding: "9px 0",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: type === "expense" ? "#2563eb" : "transparent",
                      color: type === "expense" ? "#ffffff" : "#94a3b8",
                      border: "none",
                      fontSize: 13.5,
                      fontWeight: 700,
                      transition: "all 0.15s ease",
                    }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    style={{
                      padding: "9px 0",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: type === "income" ? "#16a34a" : "transparent",
                      color: type === "income" ? "#ffffff" : "#94a3b8",
                      border: "none",
                      fontSize: 13.5,
                      fontWeight: 700,
                      transition: "all 0.15s ease",
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} style={{ padding: "22px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Payment Method */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: 6 }}>
                    Payment Method
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 4, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    {[
                      ["Digital Bank", <CreditCard key="card" style={{ width: 14, height: 14 }} />],
                      ["Cash", <Banknote key="cash" style={{ width: 14, height: 14 }} />],
                    ].map(([val, icon]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPaymentMethod(val)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "8px 0",
                          borderRadius: 9,
                          cursor: "pointer",
                          background: paymentMethod === val ? "#ffffff" : "transparent",
                          color: paymentMethod === val ? "#0f172a" : "#64748b",
                          border: paymentMethod === val ? "1px solid #cbd5e1" : "none",
                          boxShadow: paymentMethod === val ? "0 2px 6px rgba(0,0,0,0.04)" : "none",
                          fontSize: 13,
                          fontWeight: 700,
                          transition: "all 0.15s",
                        }}
                      >
                        {icon}
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: 6 }}>
                    Amount ($)
                  </label>
                  <div className="dash-input-wrap">
                    <span style={{ position: "absolute", left: 14, color: "#64748b", fontWeight: 800, fontSize: 16 }}>$</span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="dash-input"
                      style={{ paddingLeft: 30, fontSize: 16, fontWeight: 800 }}
                    />
                  </div>

                  {/* Quick increment chips */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {[5, 10, 20, 50, 100].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmount(v.toString())}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 9999,
                          cursor: "pointer",
                          background: amount === v.toString() ? "#dbeafe" : "#f1f5f9",
                          border: `1px solid ${amount === v.toString() ? "#93c5fd" : "#e2e8f0"}`,
                          color: amount === v.toString() ? "#1d4ed8" : "#64748b",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        +${v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: 6 }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Dining hall, books, transit ticket"
                    className="dash-input"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", margin: 0 }}>
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCat(!showAddCat)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#2563eb",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <FolderPlus style={{ width: 13, height: 13 }} />
                      <span>{showAddCat ? "Cancel" : "+ Add Custom"}</span>
                    </button>
                  </div>

                  {showAddCat ? (
                    <div style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Campus Printing"
                        className="dash-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateNewCategory}
                        disabled={addingCat}
                        className="dash-btn-primary"
                        style={{ height: 42, padding: "0 16px" }}
                      >
                        {addingCat ? "..." : "Add"}
                      </button>
                    </div>
                  ) : fetchingCats ? (
                    <div style={{ padding: "10px 0", fontSize: 12, color: "#64748b" }}>Loading categories...</div>
                  ) : (
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="dash-select" style={{ width: "100%" }}>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.isDefault ? "(Standard)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: 6 }}>
                    Date
                  </label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="dash-input" />
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading} className="dash-btn-primary" style={{ width: "100%", height: 46, fontSize: 14.5, marginTop: 4 }}>
                  {loading ? (
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                  ) : (
                    <>
                      <Plus style={{ width: 16, height: 16 }} />
                      <span>{editTransaction ? "Update Transaction" : "Save Transaction"}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
