import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "./categoryApi";
import { getCategoryIcon } from "../../core/categoryIcons";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";

/* ── exact landing page tokens ── */
const C = {
  hero:        "oklch(0.115 0.018 255)",
  heroFg:      "oklch(0.985 0.003 250)",
  heroLine:    "oklch(0.31 0.025 255)",
  brand:       "oklch(0.59 0.22 262)",
  brandSoft:   "oklch(0.93 0.06 262)",
  highlight:   "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth:      "oklch(0.64 0.17 157)",
  growthSoft:  "oklch(0.94 0.05 158)",
  background:  "oklch(0.99 0.003 250)",
  foreground:  "oklch(0.16 0.025 260)",
  muted:       "oklch(0.5 0.025 255)",
  border:      "oklch(0.9 0.012 255)",
  altBg:       "oklch(0.965 0.01 254)",
};
const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };

const PRESET_COLORS = [
  "oklch(0.59 0.22 262)",  // brand
  "oklch(0.64 0.17 157)",  // growth
  "oklch(0.88 0.18 157)",  // highlight
  "oklch(0.61 0.23 290)",  // purple
  "oklch(0.73 0.18 252)",  // blue-muted
  "oklch(0.83 0.17 70)",   // amber
  "oklch(0.59 0.18 230)",  // teal
  "oklch(0.5 0.025 255)",  // slate
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
];

function isColorLight(c) {
  if (!c) return false;
  if (typeof c === "string" && c.startsWith("oklch")) {
    const match = c.match(/oklch\(\s*([\d.]+)/i);
    if (match) {
      return parseFloat(match[1]) > 0.75;
    }
  }
  if (typeof c === "string" && c.startsWith("#")) {
    let hex = c.replace("#", "");
    if (hex.length === 3) hex = hex.split("").map(x => x + x).join("");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq > 175;
  }
  return false;
}

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 999,
  background: C.altBg, border: `1.5px solid ${C.border}`,
  fontSize: 13, color: C.foreground, outline: "none",
  fontFamily: M.fontFamily, transition: "border-color 0.15s", boxSizing: "border-box",
};

export default function CategoriesPage() {
  const [categories,  setCategories]  = useState([]);
  const [activeTab,   setActiveTab]   = useState("all");
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingCat,  setEditingCat]  = useState(null);
  const [name,        setName]        = useState("");
  const [type,        setType]        = useState("expense");
  const [color,       setColor]       = useState(PRESET_COLORS[0]);
  const [saving,      setSaving]      = useState(false);
  const [itemToDelete,setItemToDelete]= useState(null);

  /* ── all logic exactly preserved ── */
  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.categories);
    } catch { toast.error("Failed to load categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const filteredCategories = categories.filter(c => activeTab === "all" || c.type === activeTab);

  const handleOpenModal = (cat = null) => {
    if (cat) { setEditingCat(cat); setName(cat.name); setType(cat.type); setColor(cat.color || PRESET_COLORS[0]); }
    else      { setEditingCat(null); setName(""); setType("expense"); setColor(PRESET_COLORS[0]); }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Category name is required."); return; }
    setSaving(true);
    try {
      if (editingCat) {
        const res = await updateCategory(editingCat._id, { name: name.trim(), color });
        if (res.success) { toast.success("Category updated!"); setModalOpen(false); fetchCats(); }
      } else {
        const res = await createCategory({ name: name.trim(), type, color });
        if (res.success) { toast.success("Category added!"); setModalOpen(false); fetchCats(); }
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save category."); }
    finally { setSaving(false); }
  };

  const handleDelete    = (id) => setItemToDelete(id);
  const confirmDelete   = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteCategory(itemToDelete);
      if (res.success) { toast.success("Category removed."); fetchCats(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete."); }
    finally { setItemToDelete(null); }
  };

  const expCount = categories.filter(c => c.type === "expense").length;
  const incCount = categories.filter(c => c.type === "income").length;

  const tabs = [
    { key: "all",     label: `All (${categories.length})` },
    { key: "expense", label: `Expenses (${expCount})` },
    { key: "income",  label: `Income (${incCount})` },
  ];

  return (
    <div style={{ ...M, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>
            Organisation
          </p>
          <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.03em", lineHeight:1 }}>
            Categories
          </h1>
          <p style={{ fontSize:14, color:C.muted, margin:"6px 0 0", fontWeight:500 }}>
            Default campus tags and your custom spending labels.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} style={{
          display:"inline-flex", alignItems:"center", gap:7, height:42, padding:"0 22px", borderRadius:999,
          background:C.highlight, color:C.highlightFg, border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M,
          boxShadow:`0 4px 16px ${C.highlight}55`, transition:"background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background="oklch(0.82 0.18 157)"}
          onMouseLeave={e => e.currentTarget.style.background=C.highlight}
        >
          <Plus style={{ width:15 }} /> New Category
        </button>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", background:C.border }}>
        {[
          { label:"Total Categories", value:categories.length, accent:C.brand,  soft:C.brandSoft  },
          { label:"Expense Tags",     value:expCount,          accent:C.growth,  soft:C.growthSoft },
          { label:"Income Tags",      value:incCount,          accent:C.brand,   soft:C.brandSoft  },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", padding:"18px 22px" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:s.soft, color:s.accent, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              <Tag style={{ width:16 }} />
            </div>
            <div style={{ fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:900, color:s.accent, letterSpacing:"-0.03em", lineHeight:1, marginBottom:4 }}>
              {s.value}
            </div>
            <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:"8px 18px", borderRadius:999, cursor:"pointer", ...M,
            fontSize:13, fontWeight: activeTab===t.key ? 700 : 500,
            background: activeTab===t.key ? C.hero : "#fff",
            color: activeTab===t.key ? C.heroFg : C.muted,
            border:`1.5px solid ${activeTab===t.key ? C.hero : C.border}`,
            transition:"all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GRID ── */}
      {loading ? (
        <div style={{ padding:"60px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:C.muted, fontSize:14 }}>
          <span style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.brand, borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />
          Loading categories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8, padding:"60px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:C.brandSoft, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Tag style={{ width:22, color:C.brand }} />
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:17, fontWeight:800, color:C.foreground, margin:"0 0 6px" }}>No categories found</p>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>Create your first custom category.</p>
          </div>
          <button onClick={() => handleOpenModal()} style={{
            display:"inline-flex", alignItems:"center", gap:7, height:40, padding:"0 20px", borderRadius:999,
            background:C.highlight, color:C.highlightFg, border:"none", fontSize:13, fontWeight:800, cursor:"pointer", ...M,
          }}>
            <Plus style={{ width:13 }} /> Add Category
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {filteredCategories.map((cat, i) => {
            const isDefault = cat.isDefault;
            const bentoSchemes = [
              C.brand,
              C.hero,
              "oklch(0.64 0.17 157)",
              "oklch(0.61 0.23 290)",
            ];
            const catBg = cat.color || (isDefault ? bentoSchemes[i % bentoSchemes.length] : C.brand);
            const isLight = isColorLight(catBg);
            const fgColor = isLight ? C.foreground : "#ffffff";
            const badgeBg = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.2)";
            const badgeFg = isLight ? C.foreground : "#ffffff";
            const iconBg  = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.18)";
            const iconBorder = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.25)";

            return (
              <div key={cat._id} style={{
                background: catBg, borderRadius:8,
                border: "none",
                padding:"18px 18px",
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                transition:"transform 0.15s, box-shadow 0.15s",
                minHeight:80,
                position:"relative",
                color: fgColor,
                boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              }}
                className="group"
              >
                <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0, flex:1 }}>
                  {/* Icon */}
                  <div style={{
                    width:40, height:40, borderRadius:10, flexShrink:0,
                    background: iconBg,
                    border: `1px solid ${iconBorder}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color: fgColor,
                  }}>
                    {getCategoryIcon(cat.name, "w-5 h-5")}
                  </div>

                  <div style={{ minWidth:0 }}>
                    <h4 style={{ fontSize:14, fontWeight:700, color:fgColor, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {cat.name}
                    </h4>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                      <span style={{
                        fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999,
                        background: badgeBg,
                        color: badgeFg,
                        textTransform:"uppercase", letterSpacing:"0.06em",
                      }}>
                        {cat.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions — user can edit and delete any category */}
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <button onClick={() => handleOpenModal(cat)} title="Edit Category" style={{
                    width:30, height:30, borderRadius:"50%",
                    border: `1px solid ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"}`,
                    background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    color: fgColor, transition:"all 0.12s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)"; }}
                  >
                    <Edit2 style={{ width:12 }} />
                  </button>
                  <button onClick={() => handleDelete(cat._id)} title="Delete Category" style={{
                    width:30, height:30, borderRadius:"50%",
                    border: `1px solid ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"}`,
                    background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    color: fgColor, transition:"all 0.12s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = isLight ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)"; }}
                  >
                    <Trash2 style={{ width:12 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {modalOpen && (
        <Portal>
          <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)" }}
            onClick={() => setModalOpen(false)}>
            <div style={{ width:"100%", maxWidth:420, background:"#fff", borderRadius:16, border:`1.5px solid ${C.border}`, boxShadow:"0 24px 64px rgba(0,0,0,0.12)", padding:"28px 28px 24px", ...M }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 4px" }}>Organisation</p>
                  <h3 style={{ fontSize:20, fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.02em" }}>
                    {editingCat ? "Edit Category" : "New Category"}
                  </h3>
                </div>
                <button onClick={() => setModalOpen(false)} style={{ width:32, height:32, borderRadius:"50%", border:`1.5px solid ${C.border}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted }}>
                  <X style={{ width:14 }} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Name */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>Category Name</label>
                  <input type="text" required placeholder="e.g. Lab Supplies, Gym, Tech Gear" value={name} onChange={e => setName(e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor=C.brand}
                    onBlur={e => e.target.style.borderColor=C.border}
                  />
                </div>

                {/* Type — only when creating */}
                {!editingCat && (
                  <div>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>Type</label>
                    <div style={{ position:"relative", display:"grid", gridTemplateColumns:"1fr 1fr", padding:4, background:C.altBg, borderRadius:12, border:`1px solid ${C.border}` }}>
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          bottom: 4,
                          left: 4,
                          width: "calc(50% - 4px)",
                          borderRadius: 8,
                          background: type === "income" ? C.highlight : C.hero,
                          transform: type === "income" ? "translateX(calc(100% - 0px))" : "translateX(0)",
                          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          pointerEvents: "none",
                          zIndex: 1,
                        }}
                      />
                      {["expense","income"].map(t => (
                        <button key={t} type="button" onClick={() => setType(t)} style={{
                          position:"relative", zIndex:2,
                          padding:"9px 0", borderRadius:8, cursor:"pointer", textTransform:"capitalize",
                          background: "transparent",
                          color: type===t ? (t==="income" ? C.highlightFg : C.heroFg) : C.muted,
                          border:"none", fontSize:13, fontWeight:700, ...M, transition:"color 0.2s",
                        }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color picker */}
                <div>
                  <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:10 }}>Color Accent</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:"14px", background:C.altBg, borderRadius:12, border:`1px solid ${C.border}` }}>
                    {PRESET_COLORS.map(pc => (
                      <button key={pc} type="button" onClick={() => setColor(pc)} style={{
                        width:30, height:30, borderRadius:8, background:pc, border: color===pc ? `3px solid ${C.foreground}` : "2px solid transparent",
                        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                        transform: color===pc ? "scale(1.15)" : "scale(1)", transition:"all 0.12s",
                        flexShrink:0,
                      }}>
                        {color===pc && <Check style={{ width:12, color: isColorLight(pc) ? C.foreground : "#fff", strokeWidth:3 }} />}
                      </button>
                    ))}
                    {/* Custom color input */}
                    <div style={{ position:"relative" }}>
                      <input type="color" value={color.startsWith("#") ? color : "#3B82F6"} onChange={e => setColor(e.target.value)}
                        style={{ width:30, height:30, borderRadius:8, border:`1.5px solid ${C.border}`, cursor:"pointer", padding:2, background:"#fff" }}
                        title="Custom color"
                      />
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  {(() => {
                    const isLight = isColorLight(color);
                    const pFg = isLight ? C.foreground : "#ffffff";
                    const pBadgeBg = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.2)";
                    const pIconBg = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.18)";
                    const pIconBorder = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.25)";
                    return (
                      <div style={{
                        marginTop: 12, padding: "14px 16px", borderRadius: 10,
                        background: color, color: pFg,
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "background 0.2s, color 0.2s",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: pIconBg, border: `1px solid ${pIconBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: pFg, flexShrink: 0,
                        }}>
                          {getCategoryIcon(name || "Category", "w-4 h-4")}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: pFg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {name || "Category Preview"}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          background: pBadgeBg, color: pFg,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          {type}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Buttons */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{ padding:"11px 0", borderRadius:999, cursor:"pointer", background:"#fff", border:`1.5px solid ${C.border}`, fontSize:14, fontWeight:600, color:C.muted, ...M }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} style={{
                    padding:"11px 0", borderRadius:999, cursor:"pointer",
                    background:C.highlight, color:C.highlightFg,
                    border:"none", fontSize:14, fontWeight:800, ...M,
                    opacity: saving ? 0.7 : 1, boxShadow:`0 4px 14px ${C.highlight}55`,
                  }}>
                    {saving ? "Saving…" : editingCat ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmText="Delete"
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
