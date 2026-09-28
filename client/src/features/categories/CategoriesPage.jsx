import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, Edit2, X, Layers, ArrowDownRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "./categoryApi";
import CategoryIcon from "../../components/ui/CategoryIcon";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import "../dashboard/Dashboard.css";

const PRESET_COLORS = [
  "#2563eb",
  "#16a34a",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.categories);
    } catch {
      toast.error("Couldn't load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const filteredCategories = categories.filter((c) => activeTab === "all" || c.type === activeTab);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setType(cat.type);
      setColor(cat.color || PRESET_COLORS[0]);
    } else {
      setEditingCat(null);
      setName("");
      setType("expense");
      setColor(PRESET_COLORS[0]);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingCat) {
        const res = await updateCategory(editingCat._id, { name: name.trim(), color });
        if (res.success) {
          toast.success("Category updated.");
          setModalOpen(false);
          fetchCats();
        }
      } else {
        const res = await createCategory({ name: name.trim(), type, color });
        if (res.success) {
          toast.success("Category created.");
          setModalOpen(false);
          fetchCats();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => setItemToDelete(id);
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteCategory(itemToDelete);
      if (res.success) {
        toast.success("Category removed.");
        fetchCats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category.");
    } finally {
      setItemToDelete(null);
    }
  };

  const expCount = categories.filter((c) => c.type === "expense").length;
  const incCount = categories.filter((c) => c.type === "income").length;

  const tabs = [
    { key: "all", label: `All (${categories.length})` },
    { key: "expense", label: `Expenses (${expCount})` },
    { key: "income", label: `Income (${incCount})` },
  ];

  return (
    <div className="dash-root">
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.02em" }}>
              Budget Classifications
            </span>
          </div>
          <h1 className="dash-page-title">Categories</h1>
          <p className="dash-page-desc">Organize your expenses and income into clean student categories.</p>
        </div>

        <div className="dash-page-actions">
          <button onClick={() => handleOpenModal()} className="dash-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Strip ── */}
      <div className="dash-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {/* Total Categories */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Categories</span>
            <div className="dash-kpi-icon-box" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <Layers style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val">{categories.length}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb" }}>
              Configured
            </span>
            <span className="dash-kpi-hint">Active taxonomy</span>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Expense Categories</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <ArrowDownRight style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#dc2626" }}>
            {expCount}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#fee2e2", color: "#dc2626" }}>
              Spending
            </span>
            <span className="dash-kpi-hint">Money outflow</span>
          </div>
        </div>

        {/* Income Categories */}
        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Income Categories</span>
            <div className="dash-kpi-icon-box" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <ArrowUpRight style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#16a34a" }}>
            {incCount}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#dcfce7", color: "#16a34a" }}>
              Earnings
            </span>
            <span className="dash-kpi-hint">Money inflow</span>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="dash-btn-secondary"
            style={{
              height: 38,
              background: activeTab === t.key ? "#2563eb" : "#ffffff",
              color: activeTab === t.key ? "#ffffff" : "#0f172a",
              borderColor: activeTab === t.key ? "#2563eb" : "#e2e8f0",
              fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Category Cards Grid ── */}
      {loading ? (
        <div style={{ padding: "64px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b", fontSize: 14 }}>
          <span
            style={{
              width: 20,
              height: 20,
              border: "2px solid #e2e8f0",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <span>Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="dash-empty-box">
          <div className="dash-empty-icon">
            <Tag style={{ width: 24, height: 24 }} />
          </div>
          <h3 className="dash-empty-title">No categories found</h3>
          <p className="dash-empty-desc">Create your first custom category to organize your college finances.</p>
          <button onClick={() => handleOpenModal()} className="dash-btn-primary">
            <Plus style={{ width: 16, height: 16 }} />
            <span>Add Category</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filteredCategories.map((cat) => {
            const catColor = cat.color || "#2563eb";
            const isInc = cat.type === "income";

            return (
              <div
                key={cat._id}
                className="dash-card"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `${catColor}15`,
                      border: `1.5px solid ${catColor}30`,
                      color: catColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CategoryIcon categoryName={cat.name} className="w-5 h-5" useEmerald={isInc} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14.5, fontWeight: 800, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 7px",
                          borderRadius: 9999,
                          background: isInc ? "#dcfce7" : "#f1f5f9",
                          color: isInc ? "#16a34a" : "#64748b",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {cat.type}
                      </span>
                      {cat.isDefault && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>
                          Standard
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!cat.isDefault ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="dash-btn-secondary"
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
                      title="Edit Category"
                    >
                      <Edit2 style={{ width: 13, height: 13 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="dash-btn-danger"
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
                      title="Delete Category"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 8px",
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                    }}
                    title="Built-in system category"
                  >
                    <ShieldCheck style={{ width: 12, height: 12, color: "#3b82f6" }} />
                    <span>Preset</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Category Modal ── */}
      <Portal>
        {modalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={() => setModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }} />
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 420,
                background: "#ffffff",
                borderRadius: 22,
                border: "1px solid #e2e8f0",
                boxShadow: "0 24px 64px rgba(15,23,42,0.15)",
                padding: "26px 28px",
                fontFamily: "var(--dash-font)",
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2563eb", marginBottom: 2 }}>
                    Category Setup
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {editingCat ? "Edit Category" : "New Category"}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid #e2e8f0",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                  }}
                >
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                    Category Type
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 4, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    {[
                      { val: "expense", label: "Expense" },
                      { val: "income", label: "Income" },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        disabled={!!editingCat}
                        onClick={() => setType(t.val)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: editingCat ? "not-allowed" : "pointer",
                          background: type === t.val ? "#091227" : "transparent",
                          color: type === t.val ? "#ffffff" : "#64748b",
                          border: "none",
                          fontSize: 12.5,
                          fontWeight: 700,
                          opacity: editingCat && type !== t.val ? 0.4 : 1,
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Printing, Groceries..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="dash-input"
                    maxLength={40}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                    Color Tag
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: c,
                          border: color === c ? "3px solid #091227" : "2px solid #ffffff",
                          boxShadow: color === c ? "0 0 0 2px #3b82f6" : "0 1px 3px rgba(0,0,0,0.1)",
                          cursor: "pointer",
                          transition: "transform 0.1s",
                          transform: color === c ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="dash-btn-secondary" style={{ height: 44 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="dash-btn-primary" style={{ height: 44 }}>
                    {saving ? "Saving..." : editingCat ? "Update Category" : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Portal>

      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Category"
        message="Are you sure you want to remove this category? Associated transactions will remain under general category."
        confirmText="Remove"
      />
    </div>
  );
}
