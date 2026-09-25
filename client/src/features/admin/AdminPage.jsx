import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  CreditCard,
  Bell,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "../../core/api";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New announcement modal
  const [annModal, setAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annType, setAnnType] = useState("info");
  const [postingAnn, setPostingAnn] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, annRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users", { params: { search } }),
        api.get("/admin/announcements"),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.users);
      if (annRes.data.success) setAnnouncements(annRes.data.announcements);
    } catch (err) {
      toast.error("Failed to load admin controls.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleToggleUser = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}/toggle`);
      if (res.data.success) {
        toast.success("User status updated.");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Permanently delete this student account?")) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        toast.success("User account deleted.");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    setPostingAnn(true);
    try {
      const res = await api.post("/admin/announcements", {
        title: annTitle.trim(),
        message: annMessage.trim(),
        type: annType,
      });
      if (res.data.success) {
        toast.success("Announcement broadcasted to campus header!");
        setAnnModal(false);
        setAnnTitle("");
        setAnnMessage("");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to publish announcement.");
    } finally {
      setPostingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await api.delete(`/admin/announcements/${id}`);
      if (res.data.success) {
        toast.success("Announcement removed.");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to delete announcement.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-primary" />
            Campus Administrator Portal
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            System health, active student users, broadcast ticker announcements, and default categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnnModal(true)}
            className="py-2 px-3.5 rounded-xl bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold shadow-md shadow-brand-primary/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Broadcast Notice</span>
          </button>
          <button
            onClick={() => fetchAdminData()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-zinc-400 font-medium">Registered Students</span>
            <Users className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
          <p className="text-3xs text-brand-mint mt-1">{stats?.activeUsers || 0} active accounts</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-zinc-400 font-medium">System Ledger Volume</span>
            <CreditCard className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats?.totalTransactions || 0}</div>
          <p className="text-3xs text-zinc-400 mt-1">Total recorded student transactions</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-2xs text-zinc-400 font-medium">Broadcast Notices</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{announcements.length}</div>
          <p className="text-3xs text-zinc-400 mt-1">Live campus announcement banners</p>
        </div>
      </div>

      {/* Announcements Manager */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10 mb-4">
          <Bell className="w-4 h-4 text-brand-primary" />
          Active Campus Header Broadcasts
        </h3>

        {announcements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {announcements.map((ann) => (
              <div
                key={ann._id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{ann.title}</span>
                    <span className="text-3xs uppercase font-bold px-1.5 py-0.2 rounded bg-brand-primary text-brand-dark/20 text-brand-primary/80">
                      {ann.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{ann.message}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann._id)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-brand-coral cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-zinc-400">
            No campus broadcasts active. Click "Broadcast Notice" to push a tip to students.
          </div>
        )}
      </div>

      {/* Student Directory Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            Student Directory
          </h3>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-xs text-white placeholder-zinc-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 uppercase text-3xs font-semibold">
                <th className="pb-3 pl-2">Student</th>
                <th className="pb-3">Academic Year</th>
                <th className="pb-3">Allowance</th>
                <th className="pb-3">Savings Goal</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-white/[0.02]">
                  <td className="py-3 pl-2">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-2xs text-zinc-400">{u.email}</div>
                  </td>
                  <td className="py-3 text-zinc-300">{u.academicYear || "—"}</td>
                  <td className="py-3 text-zinc-300">${u.monthlyAllowanceBaseline || 0}</td>
                  <td className="py-3 text-zinc-300">${u.monthlySavingsGoal || 0}</td>
                  <td className="py-3">
                    <span
                      className={`text-3xs uppercase font-bold px-2 py-0.5 rounded-full border ${
                        u.isActive
                          ? "bg-brand-mint/10 text-brand-mint border-brand-mint/20"
                          : "bg-brand-coral/10 text-brand-coral border-brand-coral/20"
                      }`}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleUser(u._id)}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                          u.isActive
                            ? "text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
                            : "text-zinc-400 hover:text-brand-mint hover:bg-brand-mint/10"
                        }`}
                        title={u.isActive ? "Deactivate" : "Activate"}
                      >
                        {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-coral hover:bg-brand-coral/10 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Notice Modal */}
      {annModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div
            className="w-full max-w-md bg-brand-dark/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-primary" />
                Publish Campus Notice
              </h3>
              <button onClick={() => setAnnModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g., Financial Aid Deadline"
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Message</label>
                <textarea
                  rows="3"
                  required
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Submit all scholarship documentation by Friday 5 PM."
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Notice Type</label>
                <select
                  value={annType}
                  onChange={(e) => setAnnType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                >
                  <option value="info" className="bg-brand-obsidian">General Info</option>
                  <option value="tip" className="bg-brand-obsidian">Budgeting Tip</option>
                  <option value="warning" className="bg-brand-obsidian">Important Warning</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnModal(false)}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-zinc-300 text-xs border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingAnn}
                  className="flex-1 py-2 rounded-xl bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {postingAnn ? "Broadcasting..." : "Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
