import { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  Palette,
  Shield,
  User,
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categoryApi";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#F43F5E",
  "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6",
  "#F97316", "#3B82F6", "#64748B", "#E11D48",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "expense" | "income"
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [color, setColor] = useState("#6366F1");
  const [saving, setSaving] = useState(false);

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.categories);
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const filteredCategories = categories.filter((c) => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setType(cat.type);
      setColor(cat.color || "#6366F1");
    } else {
      setEditingCat(null);
      setName("");
      setType("expense");
      setColor("#6366F1");
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
          toast.success("Category updated!");
          setModalOpen(false);
          fetchCats();
        }
      } else {
        const res = await createCategory({ name: name.trim(), type, color });
        if (res.success) {
          toast.success("Custom category added!");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success("Category removed.");
        fetchCats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-primary" />
            Category Management
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Standard campus tags and personalized custom student categories.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="self-start sm:self-auto py-2 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-brand-primary/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex p-1 rounded-xl bg-black/40 border border-white/10 w-fit text-xs font-medium">
        <button
          onClick={() => setActiveTab("all")}
          className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "all" ? "bg-brand-primary text-brand-dark shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          All Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("expense")}
          className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "expense" ? "bg-brand-primary text-brand-dark shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Expenses ({categories.filter((c) => c.type === "expense").length})
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`py-1.5 px-3.5 rounded-lg transition-all cursor-pointer ${
            activeTab === "income" ? "bg-brand-primary text-brand-dark shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Incomes ({categories.filter((c) => c.type === "income").length})
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          Loading categories...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const isDefault = cat.isDefault;
            return (
              <div
                key={cat._id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                    style={{ backgroundColor: `${cat.color}25`, border: `1px solid ${cat.color}66` }}
                  >
                    ₵
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-brand-primary/80 transition-colors">
                      {cat.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-3xs uppercase font-bold px-1.5 py-0.2 rounded ${
                          cat.type === "income"
                            ? "bg-brand-mint/10 text-brand-mint"
                            : "bg-brand-coral/10 text-brand-coral"
                        }`}
                      >
                        {cat.type}
                      </span>
                      <span className="text-3xs text-zinc-500">•</span>
                      <span className="text-3xs text-zinc-400">
                        {isDefault ? "Default" : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>

                {!isDefault && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-coral hover:bg-brand-coral/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div
            className="w-full max-w-md bg-brand-dark/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-primary" />
                {editingCat ? "Edit Category" : "New Custom Category"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lab Supplies, Gym, Tech Gear"
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>

              {!editingCat && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Category Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                  >
                    <option value="expense" className="bg-brand-obsidian">Expense</option>
                    <option value="income" className="bg-brand-obsidian">Income</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Category Color Accent
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer ${
                        color === c ? "scale-110 ring-2 ring-white" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-zinc-300 text-xs border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCat ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
