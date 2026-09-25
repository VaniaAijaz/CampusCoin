import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import {
  getTransactions,
  deleteTransaction,
  importTransactionsCSV,
} from "./transactionApi";
import { getCategories } from "../categories/categoryApi";
import TransactionModal from "./TransactionModal";
import toast from "react-hot-toast";
import Papa from "papaparse";

export default function TransactionsPage() {
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
    } catch (err) {
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this transaction?")) return;
    try {
      const res = await deleteTransaction(id);
      if (res.success) {
        toast.success("Transaction deleted.");
        fetchTransactions();
        window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
      }
    } catch {
      toast.error("Failed to delete transaction.");
    }
  };

  const handleEdit = (tx) => {
    setEditItem(tx);
    setModalOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const csvRows = transactions.map((t) => ({
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
    toast.success("Transactions exported as CSV!");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-brand-primary" />
            Transaction Ledger
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track, filter, and audit all income stipends and campus expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl bg-black/20 hover:bg-white/10 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-brand-primary/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, merchant..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white cursor-pointer"
            >
              <option value="" className="bg-brand-obsidian">All Inflows & Outflows</option>
              <option value="expense" className="bg-brand-obsidian">Expenses Only</option>
              <option value="income" className="bg-brand-obsidian">Income Only</option>
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
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white cursor-pointer"
            >
              <option value="" className="bg-brand-obsidian">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-brand-obsidian">
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
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs border border-white/10 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            Loading transactions...
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase text-3xs font-semibold tracking-wider">
                  <th className="pb-3 pl-2">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isInc = tx.type === "income";
                  const catColor = tx.categoryId?.color || "#6366F1";
                  return (
                    <tr key={tx._id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="py-3.5 pl-2 flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                        <span className="font-semibold text-white">
                          {tx.categoryId?.name || "General"}
                        </span>
                        {tx.isFlagged && (
                          <span
                            className="p-0.5 rounded text-amber-400"
                            title={tx.flagReason}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-zinc-300">
                        {tx.description || <span className="text-zinc-500 italic">No note</span>}
                        {tx.isRecurring && (
                          <span className="ml-2 text-3xs px-1.5 py-0.5 rounded bg-brand-primary text-brand-dark/20 text-brand-primary/80 border border-brand-primary/30">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-zinc-400 whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`text-3xs uppercase font-bold px-2 py-0.5 rounded-full border ${
                            isInc
                              ? "bg-brand-mint/10 text-brand-mint border-brand-mint/20"
                              : "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isInc ? "text-brand-mint" : "text-brand-coral"
                          }`}
                        >
                          {isInc ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx._id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-coral hover:bg-brand-coral/10 transition-colors cursor-pointer"
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
          <div className="py-16 text-center text-xs text-zinc-400">
            No transactions match your search filters.
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              Showing page {page} of {pages} ({total} items total)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="py-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="py-1 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-40 cursor-pointer"
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
    </div>
  );
}
