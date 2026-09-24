import { useState, useEffect, useRef } from "react";
import { Plus, Sparkles } from "lucide-react";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import api from "../../api/axios";
import toast from "react-hot-toast";

const TODAY = new Date().toISOString().split("T")[0];

export default function AddTransactionModal({ open, onClose, defaultType = "expense", editData = null }) {
  const [form, setForm] = useState({
    type: defaultType,
    categoryId: "",
    amount: "",
    description: "",
    date: TODAY,
    isRecurring: false,
    recurringFrequency: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiTimer = useRef(null);

  // Sync defaultType and editData
  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          type: editData.type || "expense",
          categoryId: editData.categoryId?._id || editData.categoryId || "",
          amount: editData.amount?.toString() || "",
          description: editData.description || "",
          date: editData.date ? editData.date.split("T")[0] : TODAY,
          isRecurring: editData.isRecurring || false,
          recurringFrequency: editData.recurringFrequency || "",
        });
      } else {
        setForm(f => ({ ...f, type: defaultType, categoryId: "", amount: "", description: "", date: TODAY, isRecurring: false, recurringFrequency: "" }));
      }
      setAiSuggestion("");
    }
  }, [open, defaultType, editData]);

  // Load categories when type changes
  useEffect(() => {
    if (!open) return;
    const fetchCats = async () => {
      setCatLoading(true);
      try {
        const { data } = await api.get(`/categories?type=${form.type}`);
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
      } finally {
        setCatLoading(false);
      }
    };
    fetchCats();
  }, [form.type, open]);

  // AI categorize on description change
  useEffect(() => {
    if (!form.description || form.description.length < 3) { setAiSuggestion(""); return; }
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const { data } = await api.post("/tips/ai-categorize", { description: form.description });
        if (data.suggestion) {
          setAiSuggestion(data.suggestion);
          // Auto-select if no category chosen yet
          if (!form.categoryId) {
            const match = categories.find(c => c.name.toLowerCase() === data.suggestion.toLowerCase());
            if (match) setForm(f => ({ ...f, categoryId: match._id }));
          }
        } else {
          setAiSuggestion("");
        }
      } catch { setAiSuggestion(""); }
      finally { setAiLoading(false); }
    }, 700);
    return () => clearTimeout(aiTimer.current);
  }, [form.description]);

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Please select a category."); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount."); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
      };
      let res;
      if (editData) {
        res = await api.put(`/transactions/${editData._id}`, payload);
        toast.success("Transaction updated.");
      } else {
        res = await api.post("/transactions", payload);
        const flags = res.data.flags;
        if (flags?.length > 0) toast(`⚠️ ${flags[0]}`, { duration: 5000 });
        else toast.success("Transaction added.");
      }
      onClose(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onClose(false)}
      title={editData ? "Edit Transaction" : "Add Transaction"}
      footer={
        <>
          <button className="cc-btn-secondary" onClick={() => onClose(false)} disabled={loading}>Cancel</button>
          <button className="cc-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size={15} color="#fff" /> : <Plus size={15} />}
            {editData ? "Update" : "Add Transaction"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Type toggle */}
        <div>
          <label className="cc-label">Transaction Type</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["income", "expense"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t, categoryId: "" }))}
                style={{
                  height: 40,
                  borderRadius: 9,
                  border: `2px solid ${form.type === t ? (t === "income" ? "var(--color-success)" : "var(--color-danger)") : "var(--color-border)"}`,
                  background: form.type === t ? (t === "income" ? "var(--color-success-bg)" : "var(--color-danger-bg)") : "transparent",
                  color: form.type === t ? (t === "income" ? "var(--color-success)" : "var(--color-danger)") : "var(--color-muted)",
                  fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 150ms",
                  textTransform: "capitalize",
                }}
              >
                {t === "income" ? "↑ Income" : "↓ Expense"}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="cc-label">Amount</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-subtle)", fontSize: 14, fontWeight: 600 }}>$</span>
            <input
              type="number"
              className="cc-input"
              placeholder="0.00"
              value={form.amount}
              onChange={set("amount")}
              min="0.01"
              step="0.01"
              style={{ paddingLeft: 26 }}
              required
            />
          </div>
        </div>

        {/* Description with AI */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label className="cc-label" style={{ margin: 0 }}>Description</label>
            {aiLoading && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-brand)" }}><Spinner size={11} /> AI thinking...</span>}
            {!aiLoading && aiSuggestion && (
              <span style={{ fontSize: 11, color: "var(--color-brand)", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={11} /> Suggested: <strong>{aiSuggestion}</strong>
              </span>
            )}
          </div>
          <input
            type="text"
            className="cc-input"
            placeholder="e.g. Campus Cafe, Bus fare..."
            value={form.description}
            onChange={set("description")}
          />
        </div>

        {/* Category */}
        <div>
          <label className="cc-label">Category</label>
          {catLoading ? (
            <div style={{ height: 44, display: "flex", alignItems: "center", paddingLeft: 14 }}><Spinner size={16} /></div>
          ) : (
            <select className="cc-select" value={form.categoryId} onChange={set("categoryId")} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="cc-label">Date</label>
          <input type="date" className="cc-input" value={form.date} onChange={set("date")} max={TODAY} />
        </div>

        {/* Recurring */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isRecurring} onChange={set("isRecurring")} style={{ width: 16, height: 16, accentColor: "var(--color-brand)" }} />
            <span style={{ fontSize: 13, color: "var(--color-dark)", fontWeight: 500 }}>Recurring transaction</span>
          </label>
          {form.isRecurring && (
            <select className="cc-select" value={form.recurringFrequency} onChange={set("recurringFrequency")}>
              <option value="">Select frequency</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}
        </div>
      </form>
    </Modal>
  );
}
