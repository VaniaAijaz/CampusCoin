import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight, Plus, Search, Download, Upload,
  Trash2, Edit2, AlertTriangle, CreditCard, Banknote, ChevronLeft, ChevronRight,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { getTransactions, deleteTransaction, importTransactionsCSV } from "./transactionApi";
import { getCategories } from "../categories/categoryApi";
import TransactionModal from "./TransactionModal";
import TransactionDetailModal from "../../components/ui/TransactionDetailModal";
import toast from "react-hot-toast";
import Papa from "papaparse";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import AdSenseAd from "../../components/ads/AdSenseAd";

const C = {
  hero:"oklch(0.115 0.018 255)", heroFg:"oklch(0.985 0.003 250)",
  brand:"oklch(0.59 0.22 262)", brandSoft:"oklch(0.93 0.06 262)",
  highlight:"oklch(0.88 0.18 157)", highlightFg:"oklch(0.17 0.04 160)",
  growth:"oklch(0.64 0.17 157)", growthSoft:"oklch(0.94 0.05 158)",
  background:"oklch(0.99 0.003 250)", foreground:"oklch(0.16 0.025 260)",
  muted:"oklch(0.5 0.025 255)", border:"oklch(0.9 0.012 255)", altBg:"oklch(0.965 0.01 254)",
};
const M = { fontFamily:"'Manrope',ui-sans-serif,system-ui,sans-serif" };
const inputSt = { width:"100%", padding:"9px 14px", borderRadius:999, background:C.altBg, border:`1.5px solid ${C.border}`, fontSize:13, color:C.foreground, outline:"none", fontFamily:M.fontFamily, transition:"border-color 0.15s", boxSizing:"border-box" };

export default function TransactionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlCategory   = searchParams.get("category");
  const urlCategoryId = searchParams.get("categoryId");
  const urlType       = searchParams.get("type");
  const urlSearch     = searchParams.get("search");

  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);

  const [typeFilter,     setTypeFilter]     = useState(urlType || "");
  const [categoryFilter, setCategoryFilter] = useState(urlCategoryId || "");
  const [search,         setSearch]         = useState(urlSearch || "");
  const [startDate,      setStartDate]      = useState("");
  const [endDate,        setEndDate]        = useState("");

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [selectedTx,   setSelectedTx]   = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit:15 };
      if (typeFilter)     params.type       = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search)         params.search     = search;
      if (startDate)      params.startDate  = startDate;
      if (endDate)        params.endDate    = endDate;
      const res = await getTransactions(params);
      if (res.success) { setTransactions(res.transactions); setTotal(res.total); setPages(res.pages); }
    } catch { toast.error("Failed to load transactions."); }
    finally { setLoading(false); }
  }, [page, typeFilter, categoryFilter, search, startDate, endDate]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCategories();
        if (res.success && res.categories) {
          setCategories(res.categories);
          if (urlCategory && !urlCategoryId) {
            const matched = res.categories.find(c => c.name?.toLowerCase() === urlCategory.toLowerCase());
            if (matched) setCategoryFilter(matched._id);
          }
        }
      } catch {}
    };
    load();
  }, [urlCategory, urlCategoryId]);

  const handleDelete    = (id) => setItemToDelete(id);
  const confirmDelete   = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteTransaction(itemToDelete);
      if (res.success) { toast.success("Transaction deleted."); fetchTransactions(); window.dispatchEvent(new CustomEvent("campuscoin:txUpdated")); }
    } catch { toast.error("Failed to delete transaction."); }
    finally { setItemToDelete(null); }
  };
  const handleEdit = (tx) => { setEditItem(tx); setModalOpen(true); };

  const handleExportCSV = async () => {
    const tid = toast.loading("Preparing export...");
    try {
      const res = await getTransactions({ limit:5000 });
      if (!res.success || !res.transactions?.length) { toast.error("No transactions to export.", { id:tid }); return; }
      const rows = res.transactions.map(t => ({ Date:new Date(t.date).toLocaleDateString(), Category:t.categoryId?.name||"Other", Type:t.type, Amount:t.amount, Description:t.description||"", Recurring:t.isRecurring?"Yes":"No" }));
      const blob = new Blob([Papa.unparse(rows)], { type:"text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href=url; a.setAttribute("download",`campuscoin_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("Exported!", { id:tid });
    } catch { toast.error("Export failed.", { id:tid }); }
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: async (results) => {
        const rows = results.data.map(r => ({ date:r.Date||r.date, categoryName:r.Category||r.category||r.categoryName, type:(r.Type||r.type||"expense").toLowerCase(), amount:parseFloat(r.Amount||r.amount), description:r.Description||r.description||"" }));
        try {
          const res = await importTransactionsCSV(rows);
          if (res.success) { toast.success(`Imported ${res.imported} records!`); fetchTransactions(); window.dispatchEvent(new CustomEvent("campuscoin:txUpdated")); }
        } catch (err) { toast.error(err.response?.data?.message||"Import failed."); }
      },
    });
  };

  const cur = user?.currency || "USD";
  const pageIncome  = transactions.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
  const pageExpense = transactions.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);

  return (
    <div style={{ ...M, display:"flex", flexDirection:"column", gap:20 }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>Finance Ledger</p>
          <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.03em", lineHeight:1 }}>Transaction History</h1>
          <p style={{ fontSize:14, color:C.muted, margin:"6px 0 0", fontWeight:500 }}>Track, filter and manage all your income and expenses.</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:999, cursor:"pointer", background:C.altBg, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.foreground, ...M, transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.brandSoft} onMouseLeave={e=>e.currentTarget.style.background=C.altBg}>
            <Upload style={{ width:14 }} /> Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display:"none" }} />
          </label>
          <button onClick={handleExportCSV} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:999, cursor:"pointer", background:C.altBg, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.foreground, ...M, transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.brandSoft} onMouseLeave={e=>e.currentTarget.style.background=C.altBg}>
            <Download style={{ width:14 }} /> Export CSV
          </button>
          <button onClick={() => { setEditItem(null); setModalOpen(true); }} style={{ display:"inline-flex", alignItems:"center", gap:7, height:42, padding:"0 22px", borderRadius:999, background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M, boxShadow:`0 4px 16px ${C.highlight}55`, transition:"background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="oklch(0.82 0.18 157)"} onMouseLeave={e=>e.currentTarget.style.background=C.highlight}>
            <Plus style={{ width:15 }} /> Add Transaction
          </button>
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", background:C.border }}>
        {[
          { label:"Total Records", value:total,       raw:true,  accent:C.brand,  soft:C.brandSoft  },
          { label:"Page Income",   value:pageIncome,  raw:false, accent:C.growth, soft:C.growthSoft },
          { label:"Page Expenses", value:pageExpense, raw:false, accent:C.brand,  soft:C.brandSoft  },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", padding:"18px 20px" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:s.soft, color:s.accent, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}><ArrowLeftRight style={{ width:16 }} /></div>
            <div style={{ fontSize:"clamp(1.4rem,3vw,2rem)", fontWeight:900, color:C.foreground, letterSpacing:"-0.03em", lineHeight:1, marginBottom:4 }}>{s.raw ? s.value : formatCurrency(s.value,cur)}</div>
            <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"20px" }}>
        <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 14px" }}>Filter & Search</p>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:10 }}>
          <div style={{ position:"relative" }}>
            <Search style={{ width:14, position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.muted }} />
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search description..."
              style={{ ...inputSt, paddingLeft:36 }} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
          </div>
          <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}} style={{ ...inputSt, cursor:"pointer" }}>
            <option value="">All Types</option><option value="expense">Expenses</option><option value="income">Income</option>
          </select>
          <select value={categoryFilter} onChange={e=>{setCategoryFilter(e.target.value);setPage(1);}} style={{ ...inputSt, cursor:"pointer" }}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={inputSt} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
          <button onClick={()=>{setSearch("");setTypeFilter("");setCategoryFilter("");setStartDate("");setEndDate("");setPage(1);}} style={{ padding:"9px 14px", borderRadius:999, cursor:"pointer", background:C.altBg, border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:C.muted, ...M, transition:"all 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.brandSoft;e.currentTarget.style.color=C.brand;}} onMouseLeave={e=>{e.currentTarget.style.background=C.altBg;e.currentTarget.style.color=C.muted;}}>
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"60px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:C.muted, fontSize:14 }}>
            <span style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.brand, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
            Loading transactions...
          </div>
        ) : transactions.length > 0 ? (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, ...M }}>
              <thead>
                <tr style={{ borderBottom:`1.5px solid ${C.border}`, background:C.altBg }}>
                  {["Category","Description","Method","Date","Type","Amount",""].map(h=>(
                    <th key={h} style={{ padding:"12px 16px", textAlign:h==="Amount"?"right":"left", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx,i) => {
                  const isInc = tx.type==="income";
                  const catColor = tx.categoryId?.color||C.brand;
                  return (
                    <tr key={tx._id} onClick={()=>setSelectedTx(tx)} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"#fff":C.altBg, cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.brandSoft} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":C.altBg}>
                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:catColor, flexShrink:0, display:"block" }} />
                          <span style={{ fontWeight:700, color:C.foreground }}>{tx.categoryId?.name||"General"}</span>
                          {tx.isFlagged && <AlertTriangle style={{ width:12, color:"#f59e0b" }} title={tx.flagReason} />}
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px", color:C.muted, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {tx.description||<span style={{ fontStyle:"italic", color:C.border }}>No note</span>}
                        {tx.isRecurring && <span style={{ marginLeft:6, fontSize:10, padding:"2px 7px", borderRadius:999, background:C.brandSoft, color:C.brand, fontWeight:700 }}>Recurring</span>}
                      </td>
                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        {tx.paymentMethod==="Cash"
                          ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:999, background:C.growthSoft, color:C.growth, fontSize:11, fontWeight:700 }}><Banknote style={{ width:11 }} /> Cash</span>
                          : <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:999, background:C.brandSoft, color:C.brand, fontSize:11, fontWeight:700 }}><CreditCard style={{ width:11 }} /> Digital</span>
                        }
                      </td>
                      <td style={{ padding:"12px 16px", color:C.muted, whiteSpace:"nowrap", fontSize:12 }}>
                        {new Date(tx.date).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" })}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ display:"inline-block", fontSize:10, fontWeight:800, textTransform:"uppercase", padding:"3px 10px", borderRadius:999, background:isInc?C.growthSoft:C.brandSoft, color:isInc?C.growth:C.brand, letterSpacing:"0.06em" }}>{tx.type}</span>
                      </td>
                      <td style={{ padding:"12px 16px", textAlign:"right", whiteSpace:"nowrap" }}>
                        <span style={{ fontWeight:900, fontSize:14, color:isInc?C.growth:C.foreground }}>{isInc?"+":"−"}{formatCurrency(tx.amount,cur)}</span>
                      </td>
                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }} onClick={e=>e.stopPropagation()}>
                        <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                          <button onClick={e=>{e.stopPropagation();handleEdit(tx);}} style={{ width:30, height:30, borderRadius:"50%", border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, transition:"all 0.12s" }}
                            onMouseEnter={e=>{e.currentTarget.style.background=C.brandSoft;e.currentTarget.style.color=C.brand;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted;}}>
                            <Edit2 style={{ width:12 }} />
                          </button>
                          <button onClick={e=>{e.stopPropagation();handleDelete(tx._id);}} style={{ width:30, height:30, borderRadius:"50%", border:`1px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, transition:"all 0.12s" }}
                            onMouseEnter={e=>{e.currentTarget.style.background=C.growthSoft;e.currentTarget.style.color=C.growth;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted;}}>
                            <Trash2 style={{ width:12 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding:"64px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:"50%", background:C.brandSoft, display:"flex", alignItems:"center", justifyContent:"center" }}><ArrowLeftRight style={{ width:22, color:C.brand }} /></div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:17, fontWeight:800, color:C.foreground, margin:"0 0 6px" }}>No transactions found</p>
              <p style={{ fontSize:13, color:C.muted, margin:0 }}>Try adjusting filters or add your first transaction.</p>
            </div>
            <button onClick={()=>{setEditItem(null);setModalOpen(true);}} style={{ display:"inline-flex", alignItems:"center", gap:7, height:42, padding:"0 22px", borderRadius:999, background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M }}>
              <Plus style={{ width:14 }} /> Add Transaction
            </button>
          </div>
        )}

        {pages > 1 && (
          <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.altBg }}>
            <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>Page {page} of {pages} · {total} records</span>
            <div style={{ display:"flex", gap:8 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"7px 14px", borderRadius:999, cursor:page<=1?"not-allowed":"pointer", background:"#fff", border:`1.5px solid ${C.border}`, fontSize:13, fontWeight:600, color:page<=1?C.border:C.foreground, ...M, opacity:page<=1?0.5:1 }}>
                <ChevronLeft style={{ width:13 }} /> Prev
              </button>
              <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"7px 14px", borderRadius:999, cursor:page>=pages?"not-allowed":"pointer", background:C.highlight, border:"none", fontSize:13, fontWeight:700, color:C.highlightFg, ...M, opacity:page>=pages?0.5:1 }}>
                Next <ChevronRight style={{ width:13 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AdSenseAd slot="transactions" />

      <TransactionModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} editTransaction={editItem}
        onSuccess={()=>{fetchTransactions();window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));}} />

      <Portal>
        <AnimatePresence>
          {selectedTx && <TransactionDetailModal tx={selectedTx} onClose={()=>setSelectedTx(null)} />}
        </AnimatePresence>
      </Portal>

      <GlassConfirmModal isOpen={!!itemToDelete} onClose={()=>setItemToDelete(null)} onConfirm={confirmDelete} title="Delete Transaction" message="Are you sure you want to delete this transaction?" confirmText="Delete" />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
