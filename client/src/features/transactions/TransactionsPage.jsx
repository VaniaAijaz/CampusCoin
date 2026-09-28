import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Upload,
  Trash2,
  Edit2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Wallet,
  FileSpreadsheet,
  FileText,
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
import { generateTransactionsPDF } from "./TransactionStatementPDF";
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

  /* ── Export CSV / Excel Spreadsheet ── */
  const handleExportCSV = async () => {
    const tid = toast.loading("Preparing Excel / CSV export...");
    try {
      const params = { limit: 5000 };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getTransactions(params);
      if (!res.success || !res.transactions?.length) {
        toast.error("No transactions to export.", { id: tid });
        return;
      }
      const rows = res.transactions.map((t) => ({
        Date: new Date(t.date).toLocaleDateString(),
        Category: t.categoryId?.name || "Other",
        Type: t.type === "income" ? "Income" : "Expense",
        Amount: t.amount,
        Currency: user?.currency || "USD",
        Description: t.description || "",
        PaymentMethod: t.paymentMethod || "Digital Bank",
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
      toast.success("Excel / CSV Export downloaded!", { id: tid });
    } catch {
      toast.error("Export failed.", { id: tid });
    }
  };

  /* ── Export Branded PDF Statement ── */
  const handleExportPDF = async () => {
    try {
      const params = { limit: 5000 };
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getTransactions(params);
      const txs = res.success && res.transactions ? res.transactions : transactions;
      await generateTransactionsPDF(user, txs, { typeFilter, categoryFilter, startDate, endDate });
    } catch {
      toast.error("Failed to generate PDF statement.");
    }
  };

  /* ── Import CSV / Excel ── */
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tid = toast.loading("Processing file...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            toast.error("No data found in uploaded file.", { id: tid });
            return;
          }

          const rows = results.data
            .map((r) => {
              const rawAmount = r.Amount || r.amount || r.AMOUNT || r.Value || r.value || r.Total || r.total || 0;
              const cleanAmount = typeof rawAmount === "string" ? parseFloat(rawAmount.replace(/[^0-9.-]+/g, "")) : Number(rawAmount);

              const rawType = (r.Type || r.type || r.TYPE || "expense").toLowerCase();
              const type = rawType.includes("inc") || rawType === "credit" ? "income" : "expense";

              const categoryName = r.Category || r.category || r.CATEGORY || r["Category Name"] || r.categoryName || "General";
              const description = r.Description || r.description || r.DESCRIPTION || r.Note || r.Notes || r.Title || "";
              const date = r.Date || r.date || r.DATE || new Date().toISOString();
              const paymentMethod = r["Payment Method"] || r.PaymentMethod || r.paymentMethod || r.Method || "Digital Bank";

              return {
                date,
                categoryName,
                type,
                amount: Math.abs(cleanAmount) || 0,
                description,
                paymentMethod,
              };
            })
            .filter((r) => r.amount > 0);

          if (rows.length === 0) {
            toast.error("No valid transactions could be parsed.", { id: tid });
            return;
          }

          const res = await importTransactionsCSV(rows);
          if (res.success) {
            toast.success(`Successfully imported ${res.imported || rows.length} records!`, { id: tid });
            fetchTransactions();
            window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
          } else {
            toast.error(res.message || "Import failed.", { id: tid });
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to process import file.", { id: tid });
        } finally {
          e.target.value = "";
        }
      },
      error: () => {
        toast.error("Could not parse file.", { id: tid });
        e.target.value = "";
      },
    });
  };

  const cur = user?.currency || "USD";
  const pageIncome = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const pageExpense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const netFlow = pageIncome - pageExpense;

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", letterSpacing: "0.02em" }}>
              Cash Flow & Expenses
            </span>
          </div>
          <h1 className="dash-page-title">Expenses & Income</h1>
          <p className="dash-page-desc">Track where your money goes, import statements, and stay on top of daily campus spending.</p>
        </div>

        <div className="dash-page-actions">
          {/* Import CSV / Excel */}
          <label className="dash-btn-secondary" style={{ cursor: "pointer" }} title="Import transactions from CSV or Excel">
            <Upload style={{ width: 15, height: 15 }} />
            <span>Import File</span>
            <input type="file" accept=".csv,.txt,.tsv" onChange={handleImportCSV} style={{ display: "none" }} />
          </label>

          {/* Export CSV / Excel */}
          <button onClick={handleExportCSV} className="dash-btn-secondary" title="Export transactions as CSV / Excel spreadsheet">
            <FileSpreadsheet style={{ width: 15, height: 15, color: "#16a34a" }} />
            <span>Excel / CSV</span>
          </button>

          {/* Export PDF */}
          <button onClick={handleExportPDF} className="dash-btn-secondary" title="Generate and download official PDF statement">
            <FileText style={{ width: 15, height: 15, color: "#2563eb" }} />
            <span>PDF Statement</span>
          </button>

          {/* Add Transaction Button */}
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
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total Transactions</span>
            <div className="dash-kpi-icon-box" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <ArrowLeftRight style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val">{total}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb" }}>
              All time
            </span>
            <span className="dash-kpi-hint">Total recorded</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Money In (Income)</span>
            <div className="dash-kpi-icon-box" style={{ background: "#dcfce7", color: "#16a34a" }}>
              <TrendingUp style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#16a34a" }}>
            {formatCurrency(pageIncome, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#dcfce7", color: "#16a34a" }}>
              + Received
            </span>
            <span className="dash-kpi-hint">Cash inflows</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Money Out (Expenses)</span>
            <div className="dash-kpi-icon-box" style={{ background: "#fee2e2", color: "#dc2626" }}>
              <TrendingDown style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: "#0f172a" }}>
            {formatCurrency(pageExpense, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, background: "#fee2e2", color: "#dc2626" }}>
              − Spent
            </span>
            <span className="dash-kpi-hint">Cash outflows</span>
          </div>
        </div>

        <div className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Net Difference</span>
            <div className="dash-kpi-icon-box" style={{ background: netFlow >= 0 ? "#dcfce7" : "#fee2e2", color: netFlow >= 0 ? "#16a34a" : "#dc2626" }}>
              <Wallet style={{ width: 17, height: 17 }} />
            </div>
          </div>
          <div className="dash-kpi-val" style={{ color: netFlow >= 0 ? "#16a34a" : "#dc2626" }}>
            {formatCurrency(netFlow, cur)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 9999,
              background: netFlow >= 0 ? "#dcfce7" : "#fee2e2",
              color: netFlow >= 0 ? "#16a34a" : "#dc2626"
            }}>
              {netFlow >= 0 ? "Surplus" : "Deficit"}
            </span>
            <span className="dash-kpi-hint">{netFlow >= 0 ? "Cash remaining" : "Over budget"}</span>
          </div>
        </div>
      </div>

      {/* ── Quick Filter Tabs + Search Bar ── */}
      <div className="dash-card" style={{ padding: "18px 20px" }}>
        {/* Segmented Type Switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "inline-flex", padding: 4, background: "#f1f5f9", borderRadius: 9999, border: "1px solid #e2e8f0" }}>
            {[
              { val: "", label: "All Records" },
              { val: "expense", label: "🔴 Expenses Only" },
              { val: "income", label: "🟢 Income Only" },
            ].map((t) => {
              const isSel = typeFilter === t.val;
              return (
                <button
                  key={t.val}
                  onClick={() => {
                    setTypeFilter(t.val);
                    setPage(1);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 9999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: isSel ? 800 : 600,
                    background: isSel ? "#ffffff" : "transparent",
                    color: isSel ? "#0f172a" : "#64748b",
                    boxShadow: isSel ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            Showing <strong>{transactions.length}</strong> of <strong>{total}</strong> records
          </div>
        </div>

        {/* Search, Category, Date Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "center" }}>
          {/* Search */}
          <div className="dash-input-wrap">
            <Search className="dash-input-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search description..."
              className="dash-input has-icon"
            />
          </div>

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
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="dash-input"
            title="Filter from date"
          />

          {/* Reset Button */}
          <button onClick={resetFilters} className="dash-btn-secondary" style={{ height: 42 }}>
            <RotateCcw style={{ width: 14, height: 14 }} />
            <span>Reset Filters</span>
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
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: isInc ? "#dcfce7" : "#eff6ff",
                                color: isInc ? "#16a34a" : "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <CategoryIcon categoryName={tx.categoryId?.name} className="w-4 h-4" useEmerald={isInc} />
                            </div>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{tx.categoryId?.name || "General"}</span>
                            {tx.isFlagged && <AlertTriangle style={{ width: 14, height: 14, color: "#f59e0b" }} title={tx.flagReason} />}
                          </div>
                        </td>

                        <td style={{ color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 600 }}>{tx.description || <span style={{ fontStyle: "italic", color: "#94a3b8" }}>No note</span>}</span>
                          {tx.isRecurring && (
                            <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 7px", borderRadius: 9999, background: "#dbeafe", color: "#1d4ed8", fontWeight: 700 }}>
                              Recurring
                            </span>
                          )}
                        </td>

                        <td>
                          {tx.paymentMethod === "Cash" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 9999, background: "#f1f5f9", color: "#475569", fontSize: 11.5, fontWeight: 700 }}>
                              <Banknote style={{ width: 13, height: 13, color: "#16a34a" }} /> Cash
                            </span>
                          ) : tx.paymentMethod === "Mobile Wallet" ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 9999, background: "#eff6ff", color: "#1d4ed8", fontSize: 11.5, fontWeight: 700 }}>
                              <Smartphone style={{ width: 13, height: 13, color: "#2563eb" }} /> Mobile Wallet
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 9999, background: "#eff6ff", color: "#2563eb", fontSize: 11.5, fontWeight: 700 }}>
                              <CreditCard style={{ width: 13, height: 13 }} /> Digital Bank
                            </span>
                          )}
                        </td>

                        <td style={{ color: "#64748b", fontSize: 12.5, fontWeight: 500 }}>
                          {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "3px 10px",
                              borderRadius: 9999,
                              background: isInc ? "#dcfce7" : "#eff6ff",
                              color: isInc ? "#16a34a" : "#2563eb",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {isInc ? "Income" : "Expense"}
                          </span>
                        </td>

                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: isInc ? "#16a34a" : "#0f172a" }}>
                            {isInc ? "+ " : "− "}
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
            <h3 className="dash-empty-title">No transactions found.</h3>
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
