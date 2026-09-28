import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PieChart, Plus, AlertTriangle, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BudgetProgressRing from "./BudgetProgressRing";
import { getBudgets, setBudget, deleteBudget, getBudgetAlerts } from "./budgetApi";
import { getCategories } from "../categories/categoryApi";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";

const C = {
  hero:"oklch(0.115 0.018 255)", heroFg:"oklch(0.985 0.003 250)",
  heroMuted:"oklch(0.73 0.018 252)", heroLine:"oklch(0.31 0.025 255)",
  brand:"oklch(0.59 0.22 262)", brandSoft:"oklch(0.93 0.06 262)",
  highlight:"oklch(0.88 0.18 157)", highlightFg:"oklch(0.17 0.04 160)",
  growth:"oklch(0.64 0.17 157)", growthSoft:"oklch(0.94 0.05 158)",
  background:"oklch(0.99 0.003 250)", foreground:"oklch(0.16 0.025 260)",
  muted:"oklch(0.5 0.025 255)", border:"oklch(0.9 0.012 255)", altBg:"oklch(0.965 0.01 254)",
};
const M = { fontFamily:"'Manrope',ui-sans-serif,system-ui,sans-serif" };
const inputSt = { width:"100%", padding:"10px 14px", borderRadius:999, background:C.altBg, border:`1.5px solid ${C.border}`, fontSize:13, color:C.foreground, outline:"none", fontFamily:M.fontFamily, transition:"border-color 0.15s", boxSizing:"border-box" };

const getCurrentMonthStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const getNextMonthStr    = () => { const d=new Date(); d.setMonth(d.getMonth()+1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const formatMonthLabel   = (s) => { if(!s) return ""; const [y,m]=s.split("-").map(Number); return new Date(y,m-1,1).toLocaleString("en-US",{month:"long",year:"numeric"}); };

export default function BudgetPage() {
  const [searchParams] = useSearchParams();
  const urlOpen       = searchParams.get("open");
  const urlCategory   = searchParams.get("category");
  const urlCategoryId = searchParams.get("categoryId");
  const urlLimit      = searchParams.get("limit");

  const [budgets,       setBudgetsState] = useState([]);
  const [alerts,        setAlerts]       = useState([]);
  const [categories,    setCategories]   = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [selectedMonth, setSelectedMonth]= useState(getCurrentMonthStr);
  const currentMonthStr = useMemo(()=>getCurrentMonthStr(),[]);
  const nextMonthStr    = useMemo(()=>getNextMonthStr(),[]);
  const [modalOpen,     setModalOpen]    = useState(urlOpen==="create");
  const [selectedCatId, setSelectedCatId]= useState(urlCategoryId||"");
  const [limitInput,    setLimitInput]   = useState(urlLimit||"");
  const [targetMonth,   setTargetMonth]  = useState(getCurrentMonthStr);
  const [saving,        setSaving]       = useState(false);
  const [itemToDelete,  setItemToDelete] = useState(null);

  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes,aRes,cRes] = await Promise.all([getBudgets(selectedMonth),getBudgetAlerts(),getCategories("expense")]);
      if (bRes.success) setBudgetsState(bRes.budgets);
      if (aRes.success) setAlerts(aRes.alerts);
      if (cRes.success && cRes.categories) {
        setCategories(cRes.categories);
        if (urlCategory && !selectedCatId) {
          const matched = cRes.categories.find(c=>c.name?.toLowerCase()===urlCategory.toLowerCase());
          if (matched) setSelectedCatId(matched._id);
        }
      }
    } catch { toast.error("Failed to load budget data."); }
    finally { setLoading(false); }
  }, [selectedMonth]);

  useEffect(()=>{ fetchBudgetData(); },[fetchBudgetData]);

  const summary = useMemo(()=>{
    let totalCap=0,totalSpent=0,safeCount=0,warnCount=0,overCount=0;
    budgets.forEach(b=>{
      const cap=Number(b.limitAmount)||0, spent=Number(b.spentAmount)||0;
      totalCap+=cap; totalSpent+=spent;
      const pct=cap>0?(spent/cap)*100:0;
      if(pct>=100) overCount++; else if(pct>=75) warnCount++; else safeCount++;
    });
    return { totalCap, totalSpent, safeCount, warnCount, overCount, overallPct:totalCap>0?Math.round((totalSpent/totalCap)*100):0 };
  },[budgets]);

  const handleOpenSetModal = (b=null) => {
    if(b){ setSelectedCatId(b.categoryId?._id||b.categoryId); setLimitInput(b.limitAmount.toString()); setTargetMonth(selectedMonth); }
    else { const unused=categories.find(c=>!budgets.some(bg=>(bg.categoryId?._id||bg.categoryId)===c._id)); setSelectedCatId(unused?._id||categories[0]?._id||""); setLimitInput("100"); setTargetMonth(selectedMonth); }
    setModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if(!selectedCatId||!limitInput||parseFloat(limitInput)<=0){ toast.error("Enter a valid monthly cap."); return; }
    if(!targetMonth){ toast.error("Please select a target month."); return; }
    setSaving(true);
    try {
      const res = await setBudget({ categoryId:selectedCatId, month:targetMonth, limitAmount:parseFloat(limitInput) });
      if(res.success){ toast.success(`Budget saved for ${formatMonthLabel(targetMonth)}!`); setModalOpen(false); if(targetMonth!==selectedMonth) setSelectedMonth(targetMonth); else fetchBudgetData(); window.dispatchEvent(new CustomEvent("campuscoin:txUpdated")); }
    } catch(err){ toast.error(err.response?.data?.message||"Failed to set budget."); }
    finally{ setSaving(false); }
  };

  const handleDeleteBudget = (id) => setItemToDelete(id);
  const confirmDelete = async () => {
    if(!itemToDelete) return;
    try { const res=await deleteBudget(itemToDelete); if(res.success){ toast.success("Budget cap removed."); fetchBudgetData(); window.dispatchEvent(new CustomEvent("campuscoin:txUpdated")); } }
    catch{ toast.error("Failed to delete budget cap."); }
    finally{ setItemToDelete(null); }
  };

  const isCurrentActive = selectedMonth===currentMonthStr;
  const isNextActive    = selectedMonth===nextMonthStr;

  return (
    <div style={{ ...M, display:"flex", flexDirection:"column", gap:20 }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>Spending Limits</p>
          <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.03em", lineHeight:1 }}>Budget Rings</h1>
          <p style={{ fontSize:14, color:C.muted, margin:"6px 0 0", fontWeight:500 }}>Track real-time burn rates and plan ahead.</p>
        </div>
        <button onClick={()=>handleOpenSetModal()} style={{ display:"inline-flex", alignItems:"center", gap:7, height:42, padding:"0 22px", borderRadius:999, background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M, boxShadow:`0 4px 16px ${C.highlight}55`, transition:"background 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.background="oklch(0.82 0.18 157)"} onMouseLeave={e=>e.currentTarget.style.background=C.highlight}>
          <Plus style={{ width:15 }} /> Set Budget Cap
        </button>
      </div>

      {/* MONTH SWITCHER */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        {[{label:"Current Month",val:currentMonthStr},{label:"Next Month (Plan)",val:nextMonthStr}].map(t=>(
          <button key={t.val} onClick={()=>setSelectedMonth(t.val)} style={{ padding:"8px 18px", borderRadius:999, cursor:"pointer", ...M, fontSize:13, fontWeight:selectedMonth===t.val?700:500, background:selectedMonth===t.val?C.hero:"#fff", color:selectedMonth===t.val?C.heroFg:C.muted, border:`1.5px solid ${selectedMonth===t.val?C.hero:C.border}`, transition:"all 0.15s" }}>{t.label}</button>
        ))}
        <input type="month" min={currentMonthStr} value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}
          style={{ padding:"8px 14px", borderRadius:999, border:`1.5px solid ${C.border}`, background:"#fff", fontSize:13, color:C.foreground, outline:"none", cursor:"pointer", ...M }}
          onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
      </div>

      {/* MONTH BANNER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderRadius:8, background:C.hero, position:"relative", overflow:"hidden", flexWrap:"wrap", gap:10 }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.12, backgroundImage:`linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`, backgroundSize:"48px 48px" }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:10 }}>
          <Calendar style={{ width:16, color:C.highlight }} />
          <span style={{ fontSize:13, color:C.heroMuted, fontWeight:500 }}>Viewing:</span>
          <span style={{ fontSize:15, fontWeight:800, color:C.heroFg }}>{formatMonthLabel(selectedMonth)}</span>
          {isNextActive && <span style={{ fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:999, background:`${C.highlight}22`, color:C.highlight, border:`1px solid ${C.highlight}33` }}>Future Planning</span>}
        </div>
        <span style={{ position:"relative", zIndex:1, fontSize:12, color:C.heroMuted, fontWeight:500 }}>{budgets.length} cap{budgets.length!==1?"s":""} configured</span>
      </div>

      {/* KPI STRIP */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", background:C.border }}>
        {[
          { label:"Monthly Cap",       value:`$${summary.totalCap.toFixed(2)}`,   accent:C.brand,  soft:C.brandSoft  },
          { label:"Recorded Expenses", value:`$${summary.totalSpent.toFixed(2)}`, accent:C.growth, soft:C.growthSoft },
          { label:"Spent Ratio",       value:`${summary.overallPct}%`,            accent:C.brand,  soft:C.brandSoft  },
          { label:"Health Status",     value:null, accent:C.growth, soft:C.growthSoft, health:true },
        ].map(s=>(
          <div key={s.label} style={{ background:"#fff", padding:"20px" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:s.soft, color:s.accent, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}><PieChart style={{ width:16 }} /></div>
            {s.health ? (
              <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:700, color:C.growth }}>{summary.safeCount} Safe</span>
                <span style={{ color:C.border }}>·</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#d97706" }}>{summary.warnCount} Warn</span>
                <span style={{ color:C.border }}>·</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.brand }}>{summary.overCount} Over</span>
              </div>
            ) : (
              <div style={{ fontSize:"clamp(1.4rem,2.5vw,1.9rem)", fontWeight:900, color:s.accent, letterSpacing:"-0.03em", lineHeight:1, marginBottom:4 }}>{s.value}</div>
            )}
            <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ALERTS */}
      {alerts.length>0 && isCurrentActive && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderRadius:8, background:"#fffbeb", border:"1.5px solid #fbbf24", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AlertTriangle style={{ width:18, color:"#d97706", flexShrink:0 }} />
            <span style={{ fontSize:13, fontWeight:600, color:"#92400e" }}><strong>{alerts.length}</strong> category cap{alerts.length>1?"s":""} approaching or exceeding limit.</span>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {alerts.slice(0,3).map((a,i)=>(
              <span key={i} style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:999, background:"#fef3c7", color:"#92400e", border:"1px solid #fbbf24" }}>{a.budget?.categoryId?.name}: {a.percent}%</span>
            ))}
          </div>
        </div>
      )}

      {/* RINGS */}
      {loading ? (
        <div style={{ padding:"60px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:C.muted, fontSize:14 }}>
          <span style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.brand, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} /> Loading budget rings...
        </div>
      ) : budgets.length>0 ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
          {budgets.map(b=>(
            <div key={b._id} style={{ position:"relative" }} className="group">
              <div style={{ background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"20px", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <BudgetProgressRing categoryName={b.categoryId?.name||"Category"} spentAmount={b.spentAmount||0} limitAmount={b.limitAmount||100} color={b.categoryId?.color||C.brand} icon={b.categoryId?.icon||"tag"} onEdit={()=>handleOpenSetModal(b)} />
              </div>
              <button onClick={()=>handleDeleteBudget(b._id)} className="group-hover:!flex" style={{ position:"absolute", top:10, right:10, width:26, height:26, borderRadius:"50%", border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer", display:"none", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:11, transition:"all 0.12s" }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.growthSoft;e.currentTarget.style.color=C.growth;}} onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.color=C.muted;}} title="Remove Cap">✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"60px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:C.brandSoft, display:"flex", alignItems:"center", justifyContent:"center" }}><PieChart style={{ width:22, color:C.brand }} /></div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:17, fontWeight:800, color:C.foreground, margin:"0 0 6px" }}>No caps for {formatMonthLabel(selectedMonth)}</p>
            <p style={{ fontSize:13, color:C.muted, margin:0, maxWidth:380 }}>Set monthly caps to power real-time budget tracking rings.</p>
          </div>
          <button onClick={()=>handleOpenSetModal()} style={{ display:"inline-flex", alignItems:"center", gap:7, height:42, padding:"0 22px", borderRadius:999, background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M }}>
            <Plus style={{ width:14 }} /> Create Cap for {formatMonthLabel(selectedMonth)}
          </button>
        </div>
      )}

      {/* MODAL */}
      <Portal>
        <AnimatePresence>
          {modalOpen && (
            <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
              <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setModalOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)", zIndex:-1 }} />
              <motion.div key="modal" initial={{ scale:0.96, opacity:0, y:12 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.96, opacity:0, y:12 }} transition={{ type:"spring", stiffness:380, damping:32 }} onClick={e=>e.stopPropagation()}
                style={{ width:"100%", maxWidth:440, background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`, boxShadow:"0 24px 64px rgba(0,0,0,0.12)", padding:"28px 28px 24px", ...M }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 4px" }}>Spending Limits</p>
                    <h3 style={{ fontSize:20, fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.02em" }}>Configure Budget Cap</h3>
                  </div>
                  <button onClick={()=>setModalOpen(false)} style={{ width:32, height:32, borderRadius:"50%", border:`1.5px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted }}><X style={{ width:14 }} /></button>
                </div>
                <form onSubmit={handleSaveBudget} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>Target Month</label>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:4, background:C.altBg, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:10 }}>
                      {[{label:"Current Month",sub:formatMonthLabel(currentMonthStr),val:currentMonthStr},{label:"Next Month",sub:formatMonthLabel(nextMonthStr),val:nextMonthStr}].map(t=>(
                        <button key={t.val} type="button" onClick={()=>setTargetMonth(t.val)} style={{ padding:"10px 8px", borderRadius:8, cursor:"pointer", background:targetMonth===t.val?C.hero:"transparent", color:targetMonth===t.val?C.heroFg:C.muted, border:"none", fontSize:12, fontWeight:700, ...M, transition:"all 0.15s" }}>
                          {t.label}<span style={{ display:"block", fontSize:10, fontWeight:400, opacity:0.7, marginTop:2 }}>{t.sub}</span>
                        </button>
                      ))}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>Custom:</span>
                      <input type="month" min={currentMonthStr} value={targetMonth} onChange={e=>setTargetMonth(e.target.value)} style={{ ...inputSt, width:"auto", flex:1 }} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>Category</label>
                    <select value={selectedCatId} onChange={e=>setSelectedCatId(e.target.value)} style={{ ...inputSt, cursor:"pointer" }}>
                      {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>Monthly Limit</label>
                    <input type="number" step="any" min="0.01" required placeholder="e.g. 150.00" value={limitInput} onChange={e=>setLimitInput(e.target.value)} style={{ ...inputSt, fontWeight:700 }} onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
                    <button type="button" onClick={()=>setModalOpen(false)} style={{ padding:"11px 0", borderRadius:999, cursor:"pointer", background:"#fff", border:`1.5px solid ${C.border}`, fontSize:14, fontWeight:600, color:C.muted, ...M }}>Cancel</button>
                    <button type="submit" disabled={saving} style={{ padding:"11px 0", borderRadius:999, cursor:"pointer", background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, ...M, opacity:saving?0.7:1, boxShadow:`0 4px 14px ${C.highlight}55` }}>
                      {saving?"Saving…":"Save Cap"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>

      <GlassConfirmModal isOpen={!!itemToDelete} onClose={()=>setItemToDelete(null)} onConfirm={confirmDelete} title="Remove Budget Cap" message="Are you sure you want to remove this category cap?" confirmText="Remove Cap" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
