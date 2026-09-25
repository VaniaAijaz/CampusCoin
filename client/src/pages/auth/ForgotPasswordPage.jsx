import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import api from "../../core/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your campus email.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (data.token) setResetToken(data.token);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-mint/20 text-brand-mint border border-brand-mint/30 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-xs text-zinc-400 mb-5">
          If an account exists for <strong className="text-zinc-200">{email}</strong>, a password reset link has been dispatched.
        </p>

        {resetToken && (
          <div className="p-3.5 rounded-xl bg-brand-primary text-brand-dark/10 border border-brand-primary/20 text-left mb-5">
            <span className="text-3xs uppercase font-bold text-brand-primary block mb-1">
              Dev Mode Reset URL:
            </span>
            <Link
              to={`/reset-password/${resetToken}`}
              className="text-xs text-brand-primary/80 hover:text-white underline break-all font-medium block"
            >
              Reset your password now →
            </Link>
          </div>
        )}

        <Link
          to="/app"
          className="text-xs text-brand-primary hover:text-brand-primary/80 font-semibold"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Enter your campus email to receive a recovery link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Campus Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@university.edu"
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
            <Send className="w-4 h-4" />
          )}
          {loading ? "Sending link..." : "Send Reset Instructions"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center">
        <Link
          to="/app"
          className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
