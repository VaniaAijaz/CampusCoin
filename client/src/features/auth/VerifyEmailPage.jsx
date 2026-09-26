import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, RefreshCw, ChevronLeft, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../core/api";
import Iridescence from "../../components/ui/Iridescence";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login: setAuthSession, enterDemoMode, logout } = useAuth();
  const { color } = useTheme();

  const tokenParam = searchParams.get("token");
  const emailParam = searchParams.get("email") || user?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [autoVerifying, setAutoVerifying] = useState(Boolean(tokenParam));

  const inputRefs = useRef([]);

  // Auto-verify if ?token= query parameter is present in URL
  useEffect(() => {
    if (tokenParam) {
      handleTokenVerification(tokenParam);
    }
  }, [tokenParam]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTokenVerification = async (token) => {
    setLoading(true);
    setAutoVerifying(true);
    try {
      const { data } = await api.post("/auth/verify-email", { token });
      if (data.success) {
        toast.success(data.message || "Email verified successfully!");
        setAuthSession(data.user, data.token);
        navigate("/app", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification link is invalid or expired.");
    } finally {
      setLoading(false);
      setAutoVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const updated = [...otp];
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtp(updated);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = clean;
    setOtp(updated);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", {
        otp: code,
        email: emailParam,
      });

      if (data.success) {
        toast.success(data.message || "Email verified successfully!");
        setAuthSession(data.user, data.token);
        navigate("/app", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam) {
      toast.error("Unable to identify email address to resend code.");
      return;
    }

    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-verification", { email: emailParam });
      toast.success(data.message || "A new 6-digit code has been sent!");
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  const handleLaunchDemo = () => {
    enterDemoMode("student");
    toast.success("Demo mode active: Explore Campus Coin's UI & UX freely!");
    navigate("/app", { replace: true });
  };

  const handleBackToLogin = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Background Iridescence */}
      <div className="fixed inset-0 -z-20">
        <Iridescence color={color || [0.06, 0.23, 0.44]} speed={0.8} amplitude={0.12} mouseReact={false} />
      </div>
      <div className="fixed inset-0 bg-black/25 -z-10" />

      {/* Top Escape & Navigation Bar */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="min-h-[44px] px-4 flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Sign In
        </button>
        <Link
          to="/"
          className="min-h-[44px] px-4 flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20"
        >
          Home
        </Link>
      </div>

      {/* Main True Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[460px] p-8 md:p-10 rounded-[32px]
                   bg-gradient-to-br from-white/10 to-white/0
                   backdrop-blur-[64px] backdrop-saturate-[200%]
                   border border-white/20 border-b-white/5 border-r-white/5
                   shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_0_rgba(0,0,0,0.15)]
                   text-center"
      >
        {/* Verification Icon Pod */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-[20px] bg-white/10 border border-white/25 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
          <Mail className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
          Verify Your Email
        </h1>

        <p className="text-sm text-white/70 max-w-sm mx-auto mb-8 leading-relaxed">
          We sent a 6-digit confirmation code to{" "}
          <span className="font-semibold text-white">{emailParam || "your email"}</span>. Enter the code below to activate your account.
        </p>

        {autoVerifying ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <span className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-sm font-medium text-white/80">Verifying secure token...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6-Digit OTP Inputs */}
            <div className="flex justify-center gap-2.5 sm:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-mono font-bold text-white rounded-[16px]
                             bg-white/10 border border-white/20
                             focus:border-white/70 focus:bg-white/15 focus:outline-none
                             focus:shadow-[0_0_0_3px_rgba(255,255,255,0.15)]
                             transition-all"
                />
              ))}
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full min-h-[48px] rounded-full
                         bg-white hover:bg-white/95 active:scale-[0.98]
                         text-slate-950 text-sm font-bold tracking-tight
                         shadow-[0_8px_32px_rgba(255,255,255,0.2)]
                         transition-all disabled:opacity-40 cursor-pointer
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span>Activate Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Resend Action */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <span>Didn&apos;t receive a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="font-semibold text-white/90 hover:text-white transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            {resending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : countdown > 0 ? (
              <span>Resend in {countdown}s</span>
            ) : (
              <span>Resend Code</span>
            )}
          </button>
        </div>

        {/* Instant UI/UX Demo Bypass Escape Hatch */}
        <div className="mt-6 pt-6 border-t border-white/15 text-center">
          <p className="text-xs text-white/60 mb-3">Just evaluating the UI and UX?</p>
          <button
            type="button"
            onClick={handleLaunchDemo}
            className="w-full min-h-[44px] rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Explore Free Demo Mode (Skip Verification & Preview UI)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
