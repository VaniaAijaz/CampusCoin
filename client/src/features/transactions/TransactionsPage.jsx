import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit2,
  AlertTriangle,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { getTransactions, deleteTransaction, importTransactionsCSV } from "./transactionApi";
import { getCategories } from "../categories/categoryApi";
import TransactionModal from "./TransactionModal";
import TransactionDetailModal from "../../components/ui/TransactionDetailModal";
import CategoryIcon from "../../components/ui/CategoryIcon";
import toast from "react-hot-toast";
import Papa from "papaparse";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import AdSenseAd from "../../components/ads/AdSenseAd";
import "../dashboard/Dashboard.css";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlCategoryId = searchParams.get("categoryId");
  const urlType = searchParams.get("type");
  const urlSearch = searchParams.get("search");

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState(urlType || "");
  const [categoryFilter, setCategoryFilter] = useState(urlCategoryId || "");
  const [search, setSearch] = useState(urlSearch || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await getTransactions(params);
      if (res.success) {
        setTransactions(res.transactions || []);
        setTotal(res.total !== undefined ? res.total : res.transactions?.length || 0);
        setPages(res.pages || 1);
      }
    } catch {
      toast.error("Couldn't load your transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, categoryFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCategories();
        if (res.success && res.categories) {
          setCategories(res.categories);
          if (urlCategory && !urlCategoryId) {
            const matched = res.categories.find((c) => c.name?.toLowerCase() === urlCategory.toLowerCase());
            if (matched) setCategoryFilter(matched._id);
          }
        }
      } catch {}
    };
    load();
  }, [urlCategory, urlCategoryId]);

  const handleDelete = (id) => setItemToDelete(id);
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteTransaction(itemToDelete);
      if (res.success) {
        toast.success("Transaction removed.");
        fetchTransactions();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch {
      toast.error("Couldn't delete transaction.");
    } finally {
      setItemToDelete(null);
    }
  };

  const handleEdit = (tx) => {
    setEditItem(tx);
    setModalOpen(true);
  };

  const handleExportCSV = async () => {
    const tid = toast.loading("Preparing CSV export...");
    try {
      const res = await getTransactions({ limit: 5000 });
      if (!res.success || !res.transactions?.length) {
        toast.error("No transactions to export.", { id: tid });
        return;
      }
      const rows = res.transactions.map((t) => ({
        Date: new Date(t.date).toLocaleDateString(),
        Category: t.categoryId?.name || "Other",
        Type: t.type,
        Amount: t.amount,
        Description: t.description || "",
        Recurring: t.isRecurring ? "Yes" : "No",
      }));
      const blob = new Blob([Papa.unparse(rows)], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", `campuscoin_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Export downloaded!", { id: tid });
    } catch {
      toast.error("Export failed.", { id: tid });
    }
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map((r) => ({
          date: r.Date || r.date,
          categoryName: r.Category || r.category || r.categoryName,
          type: (r.Type || r.type || "expense").toLowerCase(),
          amount: parseFloat(r.Amount || r.amount),
          description: r.Description || r.description || "",
        }));
        try {
          const res = await importTransactionsCSV(rows);
          if (res.success) {
            toast.success(`Imported ${res.imported} records!`);
            fetchTransactions();
            window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Import failed.");
        }
      },
    });
  };

  const cur = user?.currency || "USD";
  const pageIncome = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const pageExpense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="dash-root">
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Expenses & Income</h1>
          <p className="dash-page-desc">Track where your money goes and manage your transaction history.</p>
        </div>

        <div className="dash-page-actions">
          <label className="dash-btn-secondary" style={{ cursor: "pointer" }}>
            <Upload style={{ width: 15, height: 15 }} />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: "none" }} />
          </label>

          <button onClick={handleExportCSV} className="dash-btn-secondary">
            <Download style={{ width: 15, height: 15 }} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="dash-btn-primary"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Strip ── */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#dbeafe", color: "#2563eb" }}>
              <ArrowLeftRight style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">{total}</div>
            <p className="dash-kpi-label">Total Records</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
            All time
          </span>
        </div>

        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <TrendingUp style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value" style={{ color: "#16a34a" }}>
              {formatCurrency(pageIncome, cur)}
            </div>
            <p className="dash-kpi-label">Page Income</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
            + Received
          </span>
        </div>

        <div className="dash-kpi-card">
          <div>
            <div className="dash-kpi-icon-wrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <TrendingDown style={{ width: 20, height: 20 }} />
            </div>
            <div className="dash-kpi-value">
              {formatCurrency(pageExpense, cur)}
            </div>
            <p className="dash-kpi-label">Page Expenses</p>
          </div>
          <span className="dash-kpi-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>
            − Spent
          </span>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="dash-card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "center" }}>
          {/* Search */}
          <div className="dash-input-wrap">
            <Search className="dash-input-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description..."
              className="dash-input has-icon"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="dash-select"
          >
            <option value="">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="dash-select"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="dash-input"
            title="Filter by start date"
          />

          {/* Reset Button */}
          <button onClick={resetFilters} className="dash-btn-secondary" style={{ height: 42 }}>
            <RotateCcw style={{ width: 14, height: 14 }} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Transaction Table Card ── */}
      <div className="dash-card" style={{ padding: 0, overflow: "hidden" }}>
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
            <span>Loading transactions...</span>
          </div>
        ) : transactions.length > 0 ? (
          <div>
            <div className="dash-table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isInc = tx.type === "income";
                    return (
                      <tr key={tx._id} onClick={() => setSelectedTx(tx)} style={{ cursor: "pointer" }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: isInc ? "#dcfce7" : "#eff6ff",
                                color: isInc ? "#16a34a" : "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <CategoryIcon categoryName={tx.categoryId?.name} className="w-3.5 h-3.5" useEmerald={isInc} />
                            </div>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{tx.categoryId?.name || "General"}</span>
                            {tx.isFlagged && <AlertTriangle style={{ width: 14, height: 14, color: "#f59e0b" }} title={tx.flagReason} />}
                          </div>
                        </td>

                        <td style={{ color: "#64748b", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {tx.description || <span style={{ fontStyle: "italic", color: "#94a3b8" }}>No note</span>}
                          {tx.isRecurring && (
                            <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 7px", borderRadius: 9999, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}>
                              Recurring
                            </span>
                          )}
                        </td>

                        <td>
                          {tx.paymentMethod === "Cash" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 9999, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>
                              <Banknote style={{ width: 12, height: 12 }} /> Cash
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 700 }}>
                              <CreditCard style={{ width: 12, height: 12 }} /> Digital
                            </span>
                          )}
                        </td>

                        <td style={{ color: "#64748b", fontSize: 12.5 }}>
                          {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 10.5,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "3px 10px",
                              borderRadius: 9999,
                              background: isInc ? "#dcfce7" : "#eff6ff",
                              color: isInc ? "#16a34a" : "#2563eb",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>

                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 900, fontSize: 14.5, color: isInc ? "#16a34a" : "#0f172a" }}>
                            {isInc ? "+" : "−"}
                            {formatCurrency(tx.amount, cur)}
                          </span>
                        </td>

                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(tx);
                              }}
                              className="dash-btn-secondary"
                              style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
                              title="Edit transaction"
                            >
                              <Edit2 style={{ width: 13, height: 13 }} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(tx._id);
                              }}
                              className="dash-btn-danger"
                              style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
                              title="Delete transaction"
                            >
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                  Page {page} of {pages} · {total} total records
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="dash-btn-secondary"
                    style={{ height: 34, padding: "0 12px", fontSize: 12.5, opacity: page <= 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft style={{ width: 14, height: 14 }} /> Prev
                  </button>
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    className="dash-btn-primary"
                    style={{ height: 34, padding: "0 14px", fontSize: 12.5, opacity: page >= pages ? 0.5 : 1 }}
                  >
                    Next <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="dash-empty-box" style={{ border: "none" }}>
            <div className="dash-empty-icon">
              <ArrowLeftRight style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="dash-empty-title">No expenses yet.</h3>
            <p className="dash-empty-desc">Add your first expense or income to start tracking your daily campus spending.</p>
            <button
              onClick={() => {
                setEditItem(null);
                setModalOpen(true);
              }}
              className="dash-btn-primary"
            >
              <Plus style={{ width: 15, height: 15 }} />
              <span>Add Transaction</span>
            </button>
          </div>
        )}
      </div>

      <AdSenseAd slot="transactions" />

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editTransaction={editItem}
        onSuccess={() => {
          fetchTransactions();
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />

      <Portal>
        <AnimatePresence>
          {selectedTx && <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
        </AnimatePresence>
      </Portal>

      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to remove this transaction record?"
        confirmText="Delete"
      />
    </div>
  );
}
