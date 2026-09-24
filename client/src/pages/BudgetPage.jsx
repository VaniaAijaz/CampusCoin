import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Target, AlertTriangle, CheckCircle } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import ProgressBar from "../components/ui/ProgressBar";
import Spinner from "../components/ui/Spinner";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const NOW = new Date();
const CURRENT_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, "0")}`;

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ categoryId: "", limitAmount: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, a, c] = await Promise.all([
        api.get(`/budgets?month=${month}`),
        api.get("/budgets/alerts"),
        api.get("/categories?type=expense"),
      ]);
      setBudgets(b.data.budgets || []);
      setAlerts(a.data.alerts || []);
      setCategories(c.data.categories || []);
    } catch { toast.error("Failed to load budgets."); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Select a category."); return; }
    if (!form.limitAmount || parseFloat(form.limitAmount) <= 0) { toast.error("Enter a valid amount."); return; }
    setSaving(true);
    try {
      await api.post("/budgets", { ...form, month, limitAmount: parseFloat(form.limitAmount) });
      toast.success("Budget saved.");
      setModalOpen(false);
      setForm({ categoryId: "", limitAmount: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save budget.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/budgets/${delId}`);
      toast.success("Budget removed.");
      setDelId(null);
      load();
    } catch { toast.error("Failed to delete."); }
    finally { setSaving(false); }
  };

  const usedCategoryIds = budgets.map(b => b.categoryId?._id || b.categoryId);
  const availableCategories = categories.filter(c => !usedCategoryIds.includes(c._id));

  return (
    <div className="page-content">
      <PageHeader
        title="Budget Goals"
        subtitle="Set monthly spending limits and track your progress in real time."
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="month"
              className="cc-input"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ width: 160, height: 38 }}
            />
            <button className="cc-btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Set Budget
            </button>
          </div>
        }
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 10, border: `1px solid ${a.isOver ? "#FCA5A5" : "#FCD34D"}`,
              background: a.isOver ? "var(--color-danger-bg)" : "var(--color-warning-bg)",
            }}>
              <AlertTriangle size={15} color={a.isOver ? "var(--color-danger)" : "var(--color-warning)"} />
              <span style={{ fontSize: 13, color: a.isOver ? "var(--color-danger-text)" : "var(--color-warning-text)", fontWeight: 500 }}>
                <strong>{a.budget.categoryId?.name}</strong>:{" "}
                {a.isOver ? `Over budget by ${fmt(a.budget.spentAmount - a.budget.limitAmount)}` : `${a.percent}% used — only ${fmt(a.budget.limitAmount - a.budget.spentAmount)} remaining`}
              </span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}><Spinner size={28} /></div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<Target size={24} />}
          title="No budgets set"
          description="Set a monthly budget per category to track your spending and get alerts."
          action={
            <button className="cc-btn-primary" style={{ fontSize: 12, height: 36 }} onClick={() => setModalOpen(true)}>
              <Plus size={13} /> Set Your First Budget
            </button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {budgets.map((b) => {
            const pct = b.limitAmount > 0 ? Math.min((b.spentAmount / b.limitAmount) * 100, 100) : 0;
            const isOver = b.spentAmount > b.limitAmount;
            const isNear = !isOver && pct >= 80;
            return (
              <div key={b._id} className="cc-card" style={{ position: "relative" }}>
                {/* Status indicator */}
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  {isOver ? (
                    <span className="cc-badge cc-badge-danger"><AlertTriangle size={10} /> Over</span>
                  ) : isNear ? (
                    <span className="cc-badge cc-badge-warning"><AlertTriangle size={10} /> Near</span>
                  ) : (
                    <span className="cc-badge cc-badge-success"><CheckCircle size={10} /> On Track</span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div className="icon-box" style={{
                    background: isOver ? "var(--color-danger-bg)" : "var(--color-brand-light)",
                    color: isOver ? "var(--color-danger)" : "var(--color-brand)",
                  }}>
                    <Target size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-dark)" }}>
                      {b.categoryId?.name || "Category"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-subtle)" }}>{month}</div>
                  </div>
                </div>

                {/* Amount display */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-subtle)", marginBottom: 2 }}>Spent</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isOver ? "var(--color-danger)" : "var(--color-dark)", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(b.spentAmount)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--color-subtle)", marginBottom: 2 }}>Budget</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-dark)", fontVariantNumeric: "tabular-nums" }}>
                      {fmt(b.limitAmount)}
                    </div>
                  </div>
                </div>

                <ProgressBar value={b.spentAmount} max={b.limitAmount} showLabel={false} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--color-subtle)" }}>
                    {isOver ? fmt(b.spentAmount - b.limitAmount) + " over" : fmt(b.limitAmount - b.spentAmount) + " remaining"}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isOver ? "var(--color-danger)" : isNear ? "var(--color-warning)" : "var(--color-muted)" }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setDelId(b._id)}
                  className="cc-btn-ghost"
                  style={{ width: "100%", marginTop: 12, color: "var(--color-danger)", fontSize: 12, height: 32 }}
                >
                  <Trash2 size={13} /> Remove Budget
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Budget Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm({ categoryId: "", limitAmount: "" }); }}
        title="Set Monthly Budget"
        maxWidth={420}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
            <button className="cc-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size={15} color="#fff" /> : <Target size={15} />}
              Save Budget
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cc-label">Expense Category</label>
            <select className="cc-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
              <option value="">Select category</option>
              {availableCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              {availableCategories.length === 0 && <option disabled>All categories have budgets</option>}
            </select>
          </div>
          <div>
            <label className="cc-label">Monthly Limit ($)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-subtle)", fontWeight: 600 }}>$</span>
              <input
                type="number"
                className="cc-input"
                placeholder="e.g. 50.00"
                value={form.limitAmount}
                onChange={e => setForm(f => ({ ...f, limitAmount: e.target.value }))}
                min="0.01"
                step="0.01"
                style={{ paddingLeft: 26 }}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!delId}
        onClose={() => setDelId(null)}
        title="Remove Budget"
        maxWidth={400}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setDelId(null)} disabled={saving}>Cancel</button>
            <button className="cc-btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? <Spinner size={15} color="#fff" /> : <Trash2 size={15} />}
              Remove
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
          Remove this budget goal? Your transaction history will not be affected.
        </p>
      </Modal>
    </div>
  );
}
