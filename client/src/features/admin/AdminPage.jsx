import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Clock,
  KeyRound,
  Copy,
  Check,
  Search,
  RefreshCw,
  LogOut,
  X,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Iridescence from "../../components/ui/Iridescence";
import api from "../../core/api";
import toast from "react-hot-toast";
import Portal from "../../components/ui/Portal";

// True Glass UI Recipe matching exact platform standard
const glassRecipe =
  "base-glass bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { color } = useTheme();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Password Reset Link Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatingForId, setGeneratingForId] = useState(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users", { params: { search } }),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
    } catch {
      toast.error("Failed to load admin controls.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Handle Generate Reset Link for Student
  const handleGenerateResetLink = async (student) => {
    setGeneratingForId(student._id);
    try {
      const res = await api.post(`/admin/users/${student._id}/reset-link`);
      if (res.data?.success) {
        setResetData({
          studentName: student.name,
          studentEmail: student.email,
          resetUrl: res.data.resetUrl,
          token: res.data.token,
        });
        setCopied(false);
        setResetModalOpen(true);
        toast.success(`Reset link generated for ${student.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate password reset link.");
    } finally {
      setGeneratingForId(null);
    }
  };

  const handleCopyLink = async () => {
    if (!resetData?.resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetData.resetUrl);
      setCopied(true);
      toast.success("Password reset link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const averageSessionMinutes = stats?.averageUserSessionTime ?? 0;

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden p-4 sm:p-6 lg:p-10 flex flex-col justify-between selection:bg-brand-primary/30">
      {/* Background WebGL Iridescence */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <Iridescence color={color || [0.06, 0.23, 0.44]} speed={0.8} amplitude={0.12} mouseReact={false} />
      </div>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] -z-10 pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto space-y-8">
        {/* Dedicated Admin Header */}
        <header className={`${glassRecipe} rounded-[28px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[20px] bg-white/15 border border-white/30 flex items-center justify-center shadow-inner shrink-0">
              <Shield className="w-6 h-6 text-amber-300 drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Admin Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Isolated Admin View
                </span>
              </div>
              <p className="text-xs text-white/70 font-medium mt-0.5">
                Logged in as <span className="text-white font-bold">{user?.name || "Administrator"}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="min-h-[44px] px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={async () => {
                try { await api.post("/users/logout-session"); } catch (_) {}
                logout();
                window.location.href = "/login";
              }}
              className="min-h-[44px] px-4 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* SECTION 1: Prominent Global Metric Card (Average User Session Time) */}
        <div className="w-full">
          <div className={`${glassRecipe} rounded-[32px] p-6 sm:p-8 relative overflow-hidden`}>
            {/* Luminous Glow Accent */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/80">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span className="uppercase tracking-wider">Global Student Engagement Metric</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Average User Session Time
                </h2>
                <p className="text-sm text-white/70 font-medium leading-relaxed">
                  Real aggregate session duration spent by students interacting with budgeting, ledger records, and transactions across Campus Coin.
                </p>
              </div>

              <div className="p-6 rounded-[24px] bg-white/10 border border-white/20 flex flex-col items-center md:items-end justify-center min-w-[220px] shadow-inner text-center md:text-right">
                <div className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm flex items-baseline gap-1.5">
                  <span>{averageSessionMinutes}</span>
                  <span className="text-lg sm:text-xl font-bold text-sky-300">min</span>
                </div>
                <p className="text-xs text-emerald-300 font-bold mt-1.5 flex items-center gap-1">
                  <span>Average Time Per Session</span>
                </p>
                <p className="text-[10px] text-white/50 font-medium mt-1">
                  Based on active verified student sessions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Clean, Responsive Student Management Table */}
        <div className={`${glassRecipe} rounded-[32px] p-6 sm:p-8 space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Student Directory & Accounts
              </h3>
              <p className="text-xs sm:text-sm text-white/60 font-medium mt-0.5">
                Manage registered students and generate password reset links.
              </p>
            </div>

            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name or email..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-black/20 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>

          {/* Table Container with Mobile Overflow Protection */}
          {loading ? (
            <div className="py-20 text-center text-xs text-white/60 flex items-center justify-center gap-2.5">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Loading student accounts...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-sm text-white/60 font-medium">
              No registered students found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[20px] bg-white/[0.02] border border-white/10">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/10 text-white/60 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Time Spent Today</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {users.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Column 1: Student Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm sm:text-base">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-white/50">
                          {student.academicYear || "Registered Student"}
                        </div>
                      </td>

                      {/* Column 2: Email */}
                      <td className="py-4 px-6 font-mono text-xs sm:text-sm text-white/90">
                        {student.email}
                      </td>

                      {/* Column 3: Time Spent Today */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-sky-300 text-sm">
                          {student.today_minutes_active || 0} min
                        </div>
                        <div className="text-[11px] text-white/50">
                          {student.today_hours_active || 0} hrs
                        </div>
                      </td>

                      {/* Column 4: Actions (Generate Reset Link) */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleGenerateResetLink(student)}
                          disabled={generatingForId === student._id}
                          className="min-h-[44px] px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold text-white hover:text-sky-300 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                          <span>
                            {generatingForId === student._id ? "Generating..." : "Generate Reset Link"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Glass Modal: Generated Password Reset Link & Copy to Clipboard */}
      <Portal>
        <AnimatePresence>
          {resetModalOpen && resetData && (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setResetModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg p-6 sm:p-7 rounded-[32px]
                         bg-white/[0.04] backdrop-blur-[80px] backdrop-saturate-[180%]
                         border border-white/20 border-t-white/30 border-l-white/30
                         shadow-[0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)]
                         space-y-5 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white tracking-tight">
                      Password Reset Link Generated
                    </h4>
                    <p className="text-xs text-white/60">
                      Generated for {resetData.studentName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setResetModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recipient Details */}
              <div className="p-3.5 rounded-2xl bg-black/20 border border-white/10 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/60">Student:</span>
                  <span className="font-bold text-white">{resetData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email:</span>
                  <span className="font-mono text-white/90">{resetData.studentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Validity:</span>
                  <span className="text-emerald-400 font-bold">1 Hour</span>
                </div>
              </div>

              {/* Link Input & Copy Action */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  Direct Password Reset URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetData.resetUrl}
                    className="flex-1 min-h-[46px] px-3.5 rounded-xl bg-black/30 border border-white/20 text-xs font-mono text-white/90 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`min-h-[46px] px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md ${
                      copied
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "bg-white text-slate-950 hover:bg-white/90"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-white/50 leading-relaxed">
                You can now share this link directly with the student via secure channel. Opening this URL will allow them to set a new password without needing their current password.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="w-full min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}
