import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { KeyRound, Eye, EyeOff, Lock } from "lucide-react";
import api from "../../core/api";
import { useAuth } from "../../features/auth/AuthContext";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      if (data.success) {
        toast.success("Password reset successfully! Redirecting to sign in...");
        navigate("/app", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Create New Password</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Choose a strong password for your Campus Coin account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white font-medium text-sm shadow-lg shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          {loading ? "Resetting..." : "Reset Password & Continue"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <Link to="/app" className="text-xs text-zinc-400 hover:text-white">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
