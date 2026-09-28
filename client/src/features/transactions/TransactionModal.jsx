import { useState, useEffect } from "react";
import { X, Plus, AlertCircle, CreditCard, Banknote, FolderPlus } from "lucide-react";
import { createTransaction, updateTransaction } from "./transactionApi";
import { getCategories, createCategory } from "../categories/categoryApi";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Portal from "../../components/ui/Portal";

const C = {
  hero:"oklch(0.115 0.018 255)", heroFg:"oklch(0.985 0.003 250)",
  heroLine:"oklch(0.31 0.025 255)",
  brand:"oklch(0.59 0.22 262)", brandSoft:"oklch(0.93 0.06 262)",
  highlight:"oklch(0.88 0.18 157)", highlightFg:"oklch(0.17 0.04 160)",
  growth:"oklch(0.64 0.17 157)", growthSoft:"oklch(0.94 0.05 158)",
  foreground:"oklch(0.16 0.025 260)", muted:"oklch(0.5 0.025 255)",
  border:"oklch(0.9 0.012 255)", altBg:"oklch(0.965 0.01 254)",
};
const M = { fontFamily:"'Manrope',ui-sans-serif,system-ui,sans-serif" };
const fieldSt = { width:"100%", padding:"11px 14px", borderRadius:999, background:C.altBg, border:`1.5px solid ${C.border}`, fontSize:14, color:C.foreground, outline:"none", fontFamily:M.fontFamily, transition:"border-color 0.15s", boxSizing:"border-box" };
const labelSt = { fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:C.muted, display:"block", marginBottom:8 };

export default function TransactionModal({ isOpen, onClose, editTransaction=null, onSuccess }) {
  const queryClient = useQueryClient();
  const [type,               setType]               = useState("expense");
  const [amount,             setAmount]             = useState("");
  const [paymentMethod,      setPaymentMethod]      = useState("Digital Bank");
  const [categoryId,         setCategoryId]         = useState("");
  const [description,        setDescription]        = useState("");
  const [date,               setDate]               = useState(new Date().toISOString().split("T")[0]);
  const [isRecurring,        setIsRecurring]        = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [categories,         setCategories]         = useState([]);
  const [fetchingCats,       setFetchingCats]       = useState(false);
  const [showAddCat,         setShowAddCat]         = useState(false);
  const [newCatName,         setNewCatName]         = useState("");
  const [addingCat,          setAddingCat]          = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setFetchingCats(true);
      try {
        const res = await getCategories(type);
        if (res.success) { setCategories(res.categories); if (!editTransaction && res.categories.length>0) setCategoryId(res.categories[0]._id); }
      } catch(err) { console.error(err); }
      finally { setFetchingCats(false); }
    };
    load();
  }, [isOpen, type, editTransaction]);

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount?.toString()||"");
      setPaymentMethod(editTransaction.paymentMethod||"Digital Bank");
      setCategoryId(editTransaction.categoryId?._id||editTransaction.categoryId||"");
      setDescription(editTransaction.description||"");
      setDate(editTransaction.date ? new Date(editTransaction.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      setIsRecurring(editTransaction.isRecurring||false);
      setRecurringFrequency(editTransaction.recurringFrequency||"monthly");
      setShowAddCat(false);
    } else {
      setType("expense"); setAmount(""); setPaymentMethod("Digital Bank"); setDescription("");
      setDate(new Date().toISOString().split("T")[0]); setIsRecurring(false); setRecurringFrequency("monthly"); setShowAddCat(false); setNewCatName("");
    }
  }, [editTransaction, isOpen]);

  const handleCreateNewCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) { toast.error("Please enter a category name."); return; }
    setAddingCat(true);
    try {
      const res = await createCategory({ name:newCatName.trim(), type, icon:"tag", color:type==="income"?"#10B981":"#38BDF8" });
      if (res.success && res.category) { setCategories(p=>[res.category,...p]); setCategoryId(res.category._id); setShowAddCat(false); setNewCatName(""); toast.success(`"${res.category.name}" created!`); }
    } catch(err) { toast.error(err.response?.data?.message||"Failed to create category."); }
    finally { setAddingCat(false); }
  };

  const transactionMutation = useMutation({
    mutationFn: async (payload) => editTransaction ? await updateTransaction(editTransaction._id, payload) : await createTransaction(payload),
    onMutate: async (newTx) => {
      if (editTransaction) return undefined;
      await queryClient.cancelQueries({ queryKey:["dashboardData"] });
      const previousData = queryClient.getQueryData(["dashboardData"]);
      queryClient.setQueryData(["dashboardData"], (old) => {
        if (!old) return old;
        const amt = parseFloat(newTx.amount);
        const currentMonth = old.metrics?.currentMonth
          ? { ...old.metrics.currentMonth }
          : null;
        let metrics = old.metrics;
        if (currentMonth) {
          if (newTx.type === "income") {
            currentMonth.income = (currentMonth.income || 0) + amt;
            currentMonth.netSavings = (currentMonth.netSavings || 0) + amt;
          } else {
            currentMonth.expense = (currentMonth.expense || 0) + amt;
            currentMonth.netSavings = (currentMonth.netSavings || 0) - amt;
          }
          metrics = { ...old.metrics, currentMonth };
        }
        const budgets = newTx.type === "expense" && old.budgets
          ? old.budgets.map((b) =>
              (b.categoryId?._id || b.categoryId) === newTx.categoryId
                ? { ...b, spentAmount: (b.spentAmount || 0) + amt }
                : b
            )
          : old.budgets;
        return { ...old, metrics, budgets };
      });
      return { previousData };
    },
    onError: (err, newTx, context) => {
      queryClient.setQueryData(["dashboardData"], context?.previousData);
      toast.error(err.response?.data?.message||"Failed to save transaction.");
    },
    onSuccess: (res) => {
      if (!editTransaction && res.flags?.length>0) {
        toast(t=>(
          <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
            <AlertCircle style={{ width:18, color:"#f59e0b", flexShrink:0 }} />
            <div><p style={{ fontWeight:700, fontSize:12, margin:0 }}>Logged with Notice:</p><p style={{ fontSize:12, margin:0, opacity:0.7 }}>{res.flags[0]}</p></div>
          </div>
        ), { duration:4000 });
      } else {
        toast.success(`Transaction ${editTransaction?"updated":"logged"}!`);
      }
      queryClient.invalidateQueries({ queryKey:["dashboardData"] });
      queryClient.invalidateQueries({ queryKey:["transactions"] });
      window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      onClose();
      if (typeof onSuccess === "function") onSuccess(res);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount||parsedAmount<=0) { toast.error("Please enter a valid amount."); return; }
    if (!categoryId) { toast.error("Please select a category."); return; }
    transactionMutation.mutate({ type, amount:parsedAmount, paymentMethod, categoryId, description:description.trim(), date:new Date(date).toISOString(), isRecurring, recurringFrequency:isRecurring?recurringFrequency:null });
  };

  const loading = transactionMutation.isPending;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", padding:0 }}
            className="sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y:"100%", opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:"100%", opacity:0 }}
              transition={{ type:"spring", stiffness:380, damping:32 }}
              onClick={e=>e.stopPropagation()}
              style={{
                width:"100%", maxWidth:480,
                background:"#fff", borderRadius:"20px 20px 0 0",
                boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",
                maxHeight:"92vh", overflowY:"auto",
                ...M,
              }}
              className="sm:rounded-[20px]"
            >
              {/* Top handle */}
              <div style={{ width:36, height:4, background:C.border, borderRadius:99, margin:"12px auto 0" }} />

              {/* Header — dark hero strip */}
              <div style={{ background:C.hero, padding:"20px 24px 18px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, opacity:0.1, backgroundImage:`linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`, backgroundSize:"40px 40px" }} />
                <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.5)", margin:"0 0 4px" }}>Finance</p>
                    <h3 style={{ fontSize:20, fontWeight:900, color:C.heroFg, margin:0, letterSpacing:"-0.02em" }}>
                      {editTransaction ? "Edit Transaction" : "Log Transaction"}
                    </h3>
                  </div>
                  <button onClick={onClose} style={{ width:34, height:34, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.heroFg }}>
                    <X style={{ width:15 }} />
                  </button>
                </div>

                {/* Type switcher inside header with animated sliding pill */}
                <div style={{ position:"relative", display:"grid", gridTemplateColumns:"1fr 1fr", marginTop:14, padding:4, background:"rgba(255,255,255,0.08)", borderRadius:12, border:"1px solid rgba(255,255,255,0.12)" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      bottom: 4,
                      left: 4,
                      width: "calc(50% - 4px)",
                      borderRadius: 9,
                      background: type === "income" ? C.highlight : C.brand,
                      transform: type === "income" ? "translateX(calc(100% - 0px))" : "translateX(0)",
                      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease",
                      boxShadow: type === "income" ? `0 2px 12px ${C.highlight}66` : `0 2px 12px ${C.brand}66`,
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    style={{
                      position: "relative",
                      zIndex: 2,
                      padding: "10px 0",
                      borderRadius: 9,
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 800,
                      color: type === "expense" ? "#ffffff" : "rgba(255,255,255,0.6)",
                      transition: "color 0.2s",
                      ...M,
                    }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    style={{
                      position: "relative",
                      zIndex: 2,
                      padding: "10px 0",
                      borderRadius: 9,
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 800,
                      color: type === "income" ? C.highlightFg : "rgba(255,255,255,0.6)",
                      transition: "color 0.2s",
                      ...M,
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} style={{ padding:"20px 24px 24px", display:"flex", flexDirection:"column", gap:16 }}>

                {/* Payment method with animated sliding pill */}
                <div>
                  <label style={labelSt}>Payment Method</label>
                  <div style={{ position:"relative", display:"grid", gridTemplateColumns:"1fr 1fr", padding:4, background:C.altBg, borderRadius:12, border:`1.5px solid ${C.border}` }}>
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        bottom: 4,
                        left: 4,
                        width: "calc(50% - 4px)",
                        borderRadius: 9,
                        background: C.hero,
                        transform: paymentMethod === "Cash" ? "translateX(calc(100% - 0px))" : "translateX(0)",
                        transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        pointerEvents: "none",
                        zIndex: 1,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Digital Bank")}
                      style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        padding: "9px 0",
                        borderRadius: 9,
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        fontSize: 13,
                        fontWeight: 700,
                        color: paymentMethod === "Digital Bank" ? C.heroFg : C.muted,
                        transition: "color 0.2s",
                        ...M,
                      }}
                    >
                      <CreditCard style={{ width: 14 }} /> Digital Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Cash")}
                      style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        padding: "9px 0",
                        borderRadius: 9,
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        fontSize: 13,
                        fontWeight: 700,
                        color: paymentMethod === "Cash" ? C.heroFg : C.muted,
                        transition: "color 0.2s",
                        ...M,
                      }}
                    >
                      <Banknote style={{ width: 14 }} /> Cash
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label style={labelSt}>Amount</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:C.muted, fontWeight:700, fontSize:15 }}>$</span>
                    <input type="number" step="any" min="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"
                      style={{ ...fieldSt, paddingLeft:30, fontSize:16, fontWeight:800 }}
                      onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                  </div>
                  {/* Quick chips */}
                  <div style={{ display:"flex", gap:7, marginTop:9, flexWrap:"wrap" }}>
                    {[5,10,20,50,100].map(v=>(
                      <button key={v} type="button" onClick={()=>setAmount(v.toString())} style={{
                        padding:"4px 12px", borderRadius:999, cursor:"pointer",
                        background: amount===v.toString() ? C.brandSoft : C.altBg,
                        border:`1px solid ${amount===v.toString() ? C.brand+"40" : C.border}`,
                        color: amount===v.toString() ? C.brand : C.muted,
                        fontSize:12, fontWeight:600, ...M,
                      }}>+${v}</button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={labelSt}>Description</label>
                  <input type="text" value={description} onChange={e=>setDescription(e.target.value)} placeholder="e.g. Dining hall, transit card, course books"
                    style={fieldSt} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                </div>

                {/* Category */}
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <label style={{ ...labelSt, margin:0 }}>Category</label>
                    <button type="button" onClick={()=>setShowAddCat(!showAddCat)} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, color:C.brand, background:"none", border:"none", cursor:"pointer", ...M }}>
                      <FolderPlus style={{ width:13 }} />{showAddCat?"Cancel":"+ Add Custom"}
                    </button>
                  </div>
                  {showAddCat ? (
                    <div style={{ padding:"14px", borderRadius:12, background:C.altBg, border:`1px solid ${C.border}`, display:"flex", gap:8 }}>
                      <input type="text" value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="e.g. Gym, Stationery"
                        style={{ ...fieldSt, flex:1 }} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                      <button type="button" onClick={handleCreateNewCategory} disabled={addingCat} style={{ height:44, padding:"0 16px", borderRadius:999, background:C.highlight, color:C.highlightFg, border:"none", fontSize:13, fontWeight:800, cursor:"pointer", ...M, flexShrink:0 }}>
                        {addingCat?"…":"Add"}
                      </button>
                    </div>
                  ) : fetchingCats ? (
                    <div style={{ padding:"10px 0", fontSize:12, color:C.muted }}>Loading categories…</div>
                  ) : (
                    <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} style={{ ...fieldSt, cursor:"pointer" }}>
                      {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label style={labelSt}>Date</label>
                  <input type="date" required value={date} onChange={e=>setDate(e.target.value)}
                    style={fieldSt} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} style={{
                  width:"100%", padding:"13px 0", borderRadius:999, cursor:"pointer",
                  background:C.highlight, color:C.highlightFg,
                  border:"none", fontSize:15, fontWeight:800, ...M,
                  opacity:loading?0.7:1, boxShadow:`0 4px 20px ${C.highlight}55`,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  marginTop:4,
                }}>
                  {loading
                    ? <span style={{ width:16, height:16, border:`2px solid ${C.highlightFg}40`, borderTopColor:C.highlightFg, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
                    : <Plus style={{ width:16 }} />
                  }
                  {loading ? "Saving…" : editTransaction ? "Update Transaction" : "Save Transaction"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Portal>
  );
}
