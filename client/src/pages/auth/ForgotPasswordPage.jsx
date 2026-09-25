import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, Coins } from "lucide-react";
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
            <p className="text-[10px] uppercase font-bold tracking-widest text-sky-300">Password Recovery</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              If an account exists for <strong className="text-white">{email}</strong>, a recovery token has been issued.
            </p>

            {resetToken && (
              <div className="p-3.5 rounded-[20px] bg-white/10 border border-white/20 text-left mb-5">
                <span className="text-[10px] uppercase font-bold text-sky-300 block mb-1">
                  Dev Mode Direct Reset URL:
                </span>
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="text-xs text-sky-300 hover:text-white underline break-all font-medium block"
                >
                  Reset your password now →
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs transition-all shadow-sm"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Reset Password</h2>
              <p className="text-xs text-white/70 mt-1">
                Enter your registered campus email to receive a recovery link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1.5">
                  Campus Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campuscoin.com"
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
                    <Send className="w-4 h-4" />
                    <span>Send Reset Instructions</span>
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
        )}
      </div>
    </div>
  );
}
