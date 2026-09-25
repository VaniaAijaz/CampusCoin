import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { KeyRound, Eye, EyeOff, Lock, Coins, ArrowLeft } from "lucide-react";
import api from "../../core/api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
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
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Refraction Canvas */}
      <div 
        className="fixed inset-0 h-screen w-screen bg-cover bg-center -z-20 scale-100"
        style={{ backgroundImage: "url('/liquid_bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] -z-10" />

      <div className="w-full max-w-md p-8 sm:p-10 rounded-[32px] bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[16px] bg-white/20 border border-white/40 flex items-center justify-center text-white shadow-inner">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-tight">Campus Coin</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-sky-300">Set New Password</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-white">Create New Password</h2>
          <p className="text-xs text-white/70 mt-1">
            Choose a secure password for your Campus Coin account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type={showPass ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-11 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white font-bold text-xs tracking-wide shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Reset Password & Continue</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link
            to="/login"
            className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
