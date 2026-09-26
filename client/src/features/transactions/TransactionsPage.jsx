import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  getTransactions,
  deleteTransaction,
  importTransactionsCSV,
} from "./transactionApi";
import { getCategories } from "../categories/categoryApi";
import TransactionModal from "./TransactionModal";
import TransactionDetailModal from "../../components/ui/TransactionDetailModal";
import toast from "react-hot-toast";
import Papa from "papaparse";
import Portal from "../../components/ui/Portal";
import GlassConfirmModal from "../../components/ui/GlassConfirmModal";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal State
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
        setTransactions(res.transactions);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch {
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, categoryFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await getCategories();
        if (res.success) setCategories(res.categories);
      } catch {
        // silent
      }
    };
    loadCats();
  }, []);

  const handleDelete = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await deleteTransaction(itemToDelete);
      if (res.success) {
        toast.success("Transaction deleted.");
        fetchTransactions();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch {
      toast.error("Failed to delete transaction.");
    } finally {
      setItemToDelete(null);
    }
  };

  const handleEdit = (tx) => {
    setEditItem(tx);
    setModalOpen(true);
  };

  // CSV Export
  const handleExportCSV = async () => {
    const loadingToast = toast.loading("Preparing CSV export...");
    try {
      const res = await getTransactions({ limit: 5000 }); // fetch a large limit to export all
      if (!res.success || !res.transactions || res.transactions.length === 0) {
        toast.error("No transactions to export.", { id: loadingToast });
        return;
      }
      const csvRows = res.transactions.map((t) => ({
        Date: new Date(t.date).toLocaleDateString(),
        Category: t.categoryId?.name || "Other",
        Type: t.type,
        Amount: t.amount,
        Description: t.description || "",
        Recurring: t.isRecurring ? "Yes" : "No",
      }));
      const csvStr = Papa.unparse(csvRows);
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `campuscoin_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Transactions exported as CSV!", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to export transactions.", { id: loadingToast });
    }
  };

  // CSV Import
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
            toast.success(`Imported ${res.imported} records successfully!`);
            fetchTransactions();
            window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to import CSV.");
        }
      },
    });
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5 drop-shadow-sm">
            <div className="p-2 rounded-full bg-white/20 border border-white/30">
              <ArrowLeftRight className="w-5 h-5 text-sky-300" />
            </div>
            Transaction Ledger
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Track, filter, and audit all income stipends and campus expenses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="py-2.5 px-4 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/30 transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/30 transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="py-2.5 px-5 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white text-xs font-bold shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 rounded-[32px] p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-white/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, merchant..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white cursor-pointer focus:outline-none focus:border-white/50"
            >
              <option value="" className="bg-[#0B0F19] text-white">All Inflows & Outflows</option>
              <option value="expense" className="bg-[#0B0F19] text-white">Expenses Only</option>
              <option value="income" className="bg-[#0B0F19] text-white">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white cursor-pointer focus:outline-none focus:border-white/50"
            >
              <option value="" className="bg-[#0B0F19] text-white">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-[#0B0F19] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div>
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("");
                setCategoryFilter("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold border border-white/25 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card (Physical True Glass) */}
      <div className="base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden transform-gpu backface-hidden" style={{ willChange: "transform, opacity" }}>
        {loading ? (
          <div className="py-16 text-center text-xs text-white/70 flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading transactions...
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto rounded-[20px] bg-white/5 border border-white/10 p-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-white/70 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Txn ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isInc = tx.type === "income";
                  const catColor = tx.categoryId?.color || "#38BDF8";
                  return (
                    <tr
                      key={tx._id}
                      onClick={() => setSelectedTx(tx)}
                      className="even:bg-white/[0.02] hover:bg-white/10 transition-colors group rounded-[16px] cursor-pointer"
                    >
                      <td className="py-3.5 px-4 flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: catColor }}
                        />
                        <span className="font-bold text-white">
                          {tx.categoryId?.name || "General"}
                        </span>
                        {tx.isFlagged && (
                          <span
                            className="p-0.5 rounded text-amber-300"
                            title={tx.flagReason}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white/90">
                        {tx.description || <span className="text-white/40 italic">No note</span>}
                        {tx.isRecurring && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {tx.paymentMethod === "Cash" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <Banknote className="w-3 h-3" /> Cash
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-bold">
                            <CreditCard className="w-3 h-3" /> Digital
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white/60 font-mono text-[10px] whitespace-nowrap">
                        {tx.transactionId || `TXN-${tx._id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3.5 px-4 text-white/70 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                            isInc
                              ? "bg-emerald-400/20 text-emerald-300 border-emerald-300/30"
                              : "bg-rose-400/20 text-rose-300 border-rose-300/30"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm drop-shadow-sm ${
                            isInc ? "text-emerald-300" : "text-white"
                          }`}
                        >
                          {isInc ? "+" : "-"}{formatCurrency(tx.amount, user?.currency || "USD")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(tx);
                            }}
                            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tx._id);
                            }}
                            className="p-1.5 rounded-full text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-white/60">
            No transactions match your search filters.
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-white/70">
              Showing page {page} of {pages} ({total} items total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="py-1.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="py-1.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editTransaction={editItem}
        onSuccess={() => {
          fetchTransactions();
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />

      {/* Physical Glass Transaction Detail Receipt Modal on click */}
      <Portal>
        <AnimatePresence>
          {selectedTx && (
            <TransactionDetailModal
              tx={selectedTx}
              onClose={() => setSelectedTx(null)}
            />
          )}
        </AnimatePresence>
      </Portal>

      <GlassConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmText="Delete"
      />
    </div>
  );
}
