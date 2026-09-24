import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Tag, TrendingUp, TrendingDown } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";

const ICON_OPTIONS = ["tag", "utensils", "bus", "home", "book-open", "tv", "music", "wallet", "briefcase", "award", "gift", "more-horizontal", "coffee", "shopping-bag", "heart", "zap"];
const COLOR_OPTIONS = ["#0118A3", "#3956BB", "#B9A572", "#E97B4F", "#16A34A", "#D97706", "#6B6D75", "#9A9CA4", "#DC2626", "#4B9B6F"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("expense");
  const [form, setForm] = useState({ name: "", type: "expense", icon: "tag", color: "#0118A3" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories || []);
    } catch { toast.error("Failed to load categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditData(null);
    setForm({ name: "", type: tab, icon: "tag", color: "#0118A3" });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditData(cat);
    setForm({ name: cat.name, type: cat.type, icon: cat.icon || "tag", color: cat.color || "#0118A3" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required."); return; }
    setSaving(true);
    try {
      if (editData) {
        await api.put(`/categories/${editData._id}`, form);
        toast.success("Category updated.");
      } else {
        await api.post("/categories", form);
        toast.success("Category created.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/categories/${delId}`);
      toast.success("Category deleted.");
      setDelId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete this category.");
    } finally { setSaving(false); }
  };

  const filtered = categories.filter(c => c.type === tab);
  const personalCats = filtered.filter(c => !c.isDefault);
  const defaultCats = filtered.filter(c => c.isDefault);

  return (
    <div className="page-content">
      <PageHeader
        title="Categories"
        subtitle="Manage your income and expense categories."
        actions={
          <button className="cc-btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Category
          </button>
        }
      />

      {/* Type tabs */}
      <div className="cc-tab-bar" style={{ marginBottom: 20 }}>
        <button className={`cc-tab${tab === "expense" ? " active" : ""}`} onClick={() => setTab("expense")}>
          <TrendingDown size={13} /> Expense Categories
        </button>
        <button className={`cc-tab${tab === "income" ? " active" : ""}`} onClick={() => setTab("income")}>
          <TrendingUp size={13} /> Income Categories
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size={28} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Personal categories */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              My Categories
            </div>
            {personalCats.length === 0 ? (
              <div className="cc-card">
                <EmptyState
                  icon={<Tag size={22} />}
                  title="No personal categories"
                  description="Add your own custom categories for better tracking."
                  action={<button className="cc-btn-primary" style={{ height: 34, fontSize: 12 }} onClick={openAdd}><Plus size={13} /> Add Category</button>}
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {personalCats.map((c) => (
                  <div key={c._id} className="cc-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                    <div className="icon-box" style={{ background: `${c.color}18`, color: c.color }}>
                      <Tag size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-dark)" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-subtle)", marginTop: 2, textTransform: "capitalize" }}>{c.type}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="cc-btn-ghost" style={{ width: 30, height: 30, padding: 0, borderRadius: 7 }} onClick={() => openEdit(c)}>
                        <Pencil size={13} />
                      </button>
                      <button className="cc-btn-ghost" style={{ width: 30, height: 30, padding: 0, borderRadius: 7, color: "var(--color-danger)" }} onClick={() => setDelId(c._id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Default categories */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Default Categories
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {defaultCats.map((c) => (
                <div key={c._id} className="cc-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", opacity: 0.8 }}>
                  <div className="icon-box" style={{ background: `${c.color}18`, color: c.color }}>
                    <Tag size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-dark)" }}>{c.name}</div>
                    <span className="cc-badge cc-badge-neutral" style={{ marginTop: 3 }}>Default</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? "Edit Category" : "Add Category"}
        maxWidth={440}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="cc-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size={15} color="#fff" /> : <Plus size={15} />}
              {editData ? "Update" : "Create Category"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cc-label">Category Name</label>
            <input type="text" className="cc-input" placeholder="e.g. Groceries" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          {!editData && (
            <div>
              <label className="cc-label">Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["expense", "income"].map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{
                      height: 38, borderRadius: 9,
                      border: `2px solid ${form.type === t ? "var(--color-brand)" : "var(--color-border)"}`,
                      background: form.type === t ? "var(--color-brand-light)" : "transparent",
                      color: form.type === t ? "var(--color-brand)" : "var(--color-muted)",
                      fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize",
                    }}
                  >{t}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="cc-label">Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                    outline: form.color === c ? `3px solid ${c}` : "none",
                    outlineOffset: 2, transition: "outline 150ms",
                  }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Category" maxWidth={400}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setDelId(null)} disabled={saving}>Cancel</button>
            <button className="cc-btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? <Spinner size={15} color="#fff" /> : <Trash2 size={15} />} Delete
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
          Delete this category? Existing transactions using it will remain but may show as uncategorized.
        </p>
      </Modal>
    </div>
  );
}
