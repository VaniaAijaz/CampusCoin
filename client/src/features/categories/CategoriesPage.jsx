import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, Edit2, Check, X, FolderPlus } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "./categoryApi";
import { getCategoryIcon } from "../../core/categoryIcons";
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
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <Tag style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{categories.length}</div>
            <p className="dash-kpi-label">Total Categories</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
            Configured
          </span>
        </div>

        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <Tag style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{expCount}</div>
            <p className="dash-kpi-label">Expense Categories</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
            Spending
          </span>
        </div>

        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <Tag style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{incCount}</div>
            <p className="dash-kpi-label">Income Categories</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
            Earnings
          </span>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
          {filteredCategories.map((cat) => {
            const catColor = cat.color || "#2563eb";
            return (
              <div
                key={cat._id}
                className="dash-card"
                style={{
                  padding: "18px 20px",
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
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: `${catColor}18`,
                      color: catColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(cat.name, "w-4 h-4")}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: cat.type === "income" ? "#16a34a" : "#64748b",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {cat.type} {cat.isDefault ? "· Standard" : ""}
                    </span>
                  </div>
                </div>

                {!cat.isDefault && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="dash-btn-secondary"
                      style={{ width: 30, height: 30, padding: 0, borderRadius: 8 }}
                      title="Edit Category"
                    >
                      <Edit2 style={{ width: 12, height: 12 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="dash-btn-danger"
                      style={{ width: 30, height: 30, padding: 0, borderRadius: 8 }}
                      title="Delete Category"
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
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
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laundry, Cafe, Subscriptions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="dash-input"
                  />
                </div>

                {!editingCat && (
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Type
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 4, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      {[
                        ["expense", "Expense"],
                        ["income", "Income"],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setType(val)}
                          style={{
                            padding: "8px 0",
                            borderRadius: 9,
                            cursor: "pointer",
                            background: type === val ? "#091227" : "transparent",
                            color: type === val ? "#ffffff" : "#64748b",
                            border: "none",
                            fontSize: 13,
                            fontWeight: 700,
                            transition: "all 0.15s",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                    Color Tag
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                          border: color === c ? "2.5px solid #0f172a" : "2px solid transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          transition: "transform 0.15s",
                          transform: color === c ? "scale(1.15)" : "scale(1)",
                        }}
                      >
                        {color === c && <Check style={{ width: 14, height: 14 }} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => setModalOpen(false)} className="dash-btn-secondary" style={{ height: 44 }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="dash-btn-primary" style={{ height: 44 }}>
                    {saving ? "Saving..." : editingCat ? "Update Category" : "Save Category"}
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
        title="Delete Category"
        message="Are you sure you want to delete this custom category?"
        confirmText="Delete"
      />
    </div>
  );
}
