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
import { getCategoryIcon } from "../../core/categoryIcons";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";

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
  const [itemToDelete, setItemToDelete] = useState(null);

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

  const handleDelete = (id) => {
    setItemToDelete(id);
  };

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
          className="self-start sm:self-auto min-h-[44px] py-2 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-brand-primary/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap p-1 rounded-2xl bg-black/40 border border-white/10 w-fit text-xs font-medium gap-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`min-h-[40px] py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            activeTab === "all" ? "bg-brand-primary text-brand-dark font-bold shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          All Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("expense")}
          className={`min-h-[40px] py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            activeTab === "expense" ? "bg-brand-primary text-brand-dark font-bold shadow-sm" : "text-zinc-400 hover:text-white"
          }`}
        >
          Expenses ({categories.filter((c) => c.type === "expense").length})
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`min-h-[40px] py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
            activeTab === "income" ? "bg-brand-primary text-brand-dark font-bold shadow-sm" : "text-zinc-400 hover:text-white"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredCategories.map((cat) => {
            const isDefault = cat.isDefault;
            return (
              <div
                key={cat._id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300 flex items-center justify-between gap-3 group min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{ backgroundColor: `${cat.color}25`, border: `1px solid ${cat.color}66` }}
                  >
                    {getCategoryIcon(cat.name, "w-5 h-5")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm md:text-base font-bold text-white group-hover:text-brand-primary/90 transition-colors truncate">
                      {cat.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          cat.type === "income"
                            ? "bg-brand-mint/15 text-brand-mint border border-brand-mint/30"
                            : "bg-brand-coral/15 text-brand-coral border border-brand-coral/30"
                        }`}
                      >
                        {cat.type}
                      </span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {isDefault ? "Default" : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>

                {!isDefault && (
                  <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="min-h-[44px] min-w-[44px] rounded-xl text-zinc-400 hover:text-brand-coral hover:bg-brand-coral/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
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
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
              className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white/[0.03] backdrop-blur-[64px] border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] p-6"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
                <Tag className="w-5 h-5 text-brand-primary" />
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
                <label className="block text-xs font-bold text-white/70 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lab Supplies, Gym, Tech Gear"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs outline-none focus:border-brand-primary transition-colors placeholder:text-white/30"
                />
              </div>

              {!editingCat && (
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1">
                    Category Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs outline-none focus:border-brand-primary transition-colors"
                  >
                    <option value="expense" className="bg-[#0B0F19]">Expense</option>
                    <option value="income" className="bg-[#0B0F19]">Income</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/70 mb-2">
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

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-xs shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCat ? "Update Category" : "Create Category"}
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
    </div>
  );
}
