import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Filter, Pencil, Trash2,
  TrendingUp, TrendingDown, Upload, ChevronLeft, ChevronRight, AlertTriangle
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import Papa from "papaparse";

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filters, setFilters] = useState({ type: "", categoryId: "", startDate: "", endDate: "", search: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories || []);
    } catch { /* silent */ }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); loadCategories(); }, [load]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/transactions/${deleteId}`);
      toast.success("Transaction deleted.");
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddClose = (refreshed) => {
    setAddOpen(false);
    setEditData(null);
    if (refreshed) load();
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const rows = result.data.map((r) => ({
            date: r.date || r.Date,
            description: r.description || r.Description || r.note || "",
            amount: r.amount || r.Amount,
            type: (r.type || r.Type || "expense").toLowerCase(),
            categoryName: r.category || r.Category || "Miscellaneous",
          }));
          const { data } = await api.post("/transactions/import-csv", { rows });
          toast.success(`Imported ${data.imported} transactions. ${data.skipped} skipped.`);
          setImportOpen(false);
          load();
        } catch (err) {
          toast.error(err.response?.data?.message || "Import failed.");
        }
      },
    });
    e.target.value = "";
  };

  const clearFilters = () => { setFilters({ type: "", categoryId: "", startDate: "", endDate: "", search: "" }); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="page-content">
      <PageHeader
        title="Transactions"
        subtitle={`${total} total transactions`}
        actions={
          <>
            <button className="cc-btn-secondary" onClick={() => setImportOpen(true)} title="Import CSV">
              <Upload size={15} /> Import CSV
            </button>
            <button className="cc-btn-primary" onClick={() => { setEditData(null); setAddOpen(true); }}>
              <Plus size={15} /> Add Transaction
            </button>
          </>
        }
      />

      {/* Search + Filters */}
      <div className="cc-card" style={{ marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <Search size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            />
          </div>
          <button
            className={`cc-btn-secondary`}
            onClick={() => setShowFilters(s => !s)}
            style={hasFilters ? { borderColor: "var(--color-brand)", color: "var(--color-brand)" } : {}}
          >
            <Filter size={15} /> Filters {hasFilters ? "●" : ""}
          </button>
          {hasFilters && (
            <button className="cc-btn-ghost" onClick={clearFilters} style={{ color: "var(--color-danger)", fontSize: 12 }}>
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
            <div>
              <label className="cc-label">Type</label>
              <select className="cc-select" value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="cc-label">Category</label>
              <select className="cc-select" value={filters.categoryId} onChange={e => { setFilters(f => ({ ...f, categoryId: e.target.value })); setPage(1); }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="cc-label">From</label>
              <input type="date" className="cc-input" value={filters.startDate} onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }} />
            </div>
            <div>
              <label className="cc-label">To</label>
              <input type="date" className="cc-input" value={filters.endDate} onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }} />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="cc-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
            <Spinner size={28} />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<TrendingDown size={24} />}
            title="No transactions found"
            description={hasFilters ? "Try adjusting your filters." : "Start by adding your first income or expense."}
            action={!hasFilters && (
              <button className="cc-btn-primary" style={{ fontSize: 12, height: 34 }} onClick={() => setAddOpen(true)}>
                <Plus size={13} /> Add Transaction
              </button>
            )}
          />
        ) : (
          <>
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="icon-box" style={{
                          width: 32, height: 32,
                          background: tx.type === "income" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                          color: tx.type === "income" ? "var(--color-success)" : "var(--color-danger)",
                          borderRadius: 8,
                        }}>
                          {tx.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--color-dark)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tx.description || "—"}
                          </div>
                          {tx.isFlagged && (
                            <div style={{ fontSize: 11, color: "var(--color-warning)", display: "flex", alignItems: "center", gap: 3 }}>
                              <AlertTriangle size={10} /> {tx.flagReason?.slice(0, 50)}
                            </div>
                          )}
                          {tx.isRecurring && (
                            <span className="cc-badge cc-badge-info" style={{ marginTop: 2 }}>
                              🔁 {tx.recurringFrequency}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="cat-dot" style={{ background: tx.categoryId?.color || "var(--color-subtle)" }} />
                        <span style={{ color: "var(--color-muted)" }}>{tx.categoryId?.name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--color-muted)", whiteSpace: "nowrap" }}>
                      {new Date(tx.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td>
                      <span className={`cc-badge ${tx.type === "income" ? "cc-badge-success" : "cc-badge-danger"}`} style={{ textTransform: "capitalize" }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", color: tx.type === "income" ? "var(--color-success)" : "var(--color-danger)" }}>
                      {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                        <button
                          className="cc-btn-ghost"
                          style={{ width: 32, height: 32, padding: 0, borderRadius: 7 }}
                          onClick={() => { setEditData(tx); setAddOpen(true); }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="cc-btn-ghost"
                          style={{ width: 32, height: 32, padding: 0, borderRadius: 7, color: "var(--color-danger)" }}
                          onClick={() => setDeleteId(tx._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 20px",
                borderTop: "1px solid var(--color-border)",
              }}>
                <span style={{ fontSize: 12, color: "var(--color-subtle)" }}>
                  Page {page} of {pages} · {total} transactions
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="cc-btn-secondary" style={{ width: 32, height: 32, padding: 0 }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={15} />
                  </button>
                  <button className="cc-btn-secondary" style={{ width: 32, height: 32, padding: 0 }} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddTransactionModal open={addOpen} onClose={handleAddClose} defaultType="expense" editData={editData} />

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Transaction"
        maxWidth={420}
        footer={
          <>
            <button className="cc-btn-secondary" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</button>
            <button className="cc-btn-danger" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <Spinner size={15} color="#fff" /> : <Trash2 size={15} />}
              Delete
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
      </Modal>

      {/* CSV Import Modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Transactions from CSV" maxWidth={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--color-page)", borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-dark)", margin: "0 0 6px" }}>CSV Format Required:</p>
            <code style={{ fontSize: 11, color: "var(--color-muted)", display: "block", lineHeight: 1.8 }}>
              date, description, amount, type, category<br />
              2024-01-15, Campus Cafe, 5.50, expense, Food<br />
              2024-01-01, Allowance, 200, income, Allowance
            </code>
          </div>
          <label className="cc-btn-primary" style={{ cursor: "pointer", justifyContent: "center" }}>
            <Upload size={15} /> Choose CSV File
            <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: "none" }} />
          </label>
        </div>
      </Modal>
    </div>
  );
}
