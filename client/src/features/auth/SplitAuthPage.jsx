import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { auth, googleProvider, signInWithPopup } from "../../core/firebaseClient";
import api from "../../core/api";
import Iridescence from "../../components/ui/Iridescence";
import {
  Coins, Eye, EyeOff, ArrowRight, Sparkles,
  Shield, UserCheck, ChevronLeft, CheckCircle2,
  TrendingUp, Zap, Lock, Mail, User
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Animated Heading (Staggered Characters) ── */
function AnimatedHeading({ text, className = "" }) {
  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/* ── Floating Label Form Input ── */
function FloatInput({ label, name, type = "text", value, onChange, required, autoComplete, icon: Icon }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const filled = value?.length > 0;
  const float = focused || filled;

  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        name={name}
        type={isPassword ? (show ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`peer w-full min-h-[52px] ${Icon ? "pl-11" : "pl-4"} pr-4 pt-5 pb-2 rounded-[18px] bg-white/10
                    border text-sm text-white outline-none transition-all duration-200
                    placeholder-transparent
                    ${focused
                      ? "border-white/60 bg-white/15 shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                      : "border-white/20 hover:border-white/35"
                    }
                    ${isPassword ? "pr-12" : ""}`}
        placeholder={label}
      />
      {/* Floating Label */}
      <label
        className={`absolute ${Icon ? "left-11" : "left-4"} pointer-events-none transition-all duration-200 font-medium
                    ${float
                      ? "top-1.5 text-[10px] text-white/60 tracking-wider uppercase"
                      : "top-1/2 -translate-y-1/2 text-sm text-white/40"
                    }`}
      >
        {label}
      </label>
      {/* Password Visibility Toggle */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

export default function SplitAuthPage({ defaultMode = "login" }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, loading: contextLoading, login: setAuthSession, enterDemoMode } = useAuth();
  const { color } = useTheme();
  const isAuthLoading = authLoading !== undefined ? authLoading : contextLoading;

  const [isLogin, setIsLogin] = useState(() => {
    if (searchParams.get("mode") === "register" || location.pathname === "/register") return false;
    if (searchParams.get("mode") === "login" || location.pathname === "/login") return true;
    return defaultMode === "login";
  });

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(user?.role === "admin" ? "/app/admin" : "/app", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, user, navigate]);

  useEffect(() => {
    if (location.pathname === "/register") setIsLogin(false);
    else if (location.pathname === "/login") setIsLogin(true);
  }, [location.pathname]);

  const handleAuthSuccess = (userData, token, msg) => {
    setAuthSession(userData, token);
    toast.success(msg || `Welcome, ${userData.name}!`);
    navigate(userData.role === "admin" ? "/app/admin" : "/app", { replace: true });
  };

  const handleQuickDemo = (role) => {
    const demoUser = enterDemoMode(role);
    toast.success(`Demo Mode Active: Welcome, ${demoUser.name}!`);
    navigate(role === "admin" ? "/app/admin" : "/app", { replace: true });
  };

  useEffect(() => {
    const d = searchParams.get("demo");
    if (d === "student" || d === "admin") handleQuickDemo(d);
  }, [searchParams]);

  const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, formData);
      if (data.success) {
        handleAuthSuccess(data.user, data.token, `Welcome, ${data.user.name.split(" ")[0]}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Attempt login first, with auto-fallback to register
      try {
        const { data } = await api.post("/auth/google/login", { idToken });
        if (data.success) {
          handleAuthSuccess(data.user, data.token, `Welcome, ${data.user.name.split(" ")[0]}!`);
          return;
        }
      } catch (loginErr) {
        if (loginErr.response?.status === 404) {
          const { data } = await api.post("/auth/google/register", { idToken });
          if (data.success) {
            handleAuthSuccess(data.user, data.token, `Welcome, ${data.user.name.split(" ")[0]}!`);
            return;
          }
        }
        throw loginErr;
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error(err.response?.data?.message || err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    navigate(toLogin ? "/login" : "/register", { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-[#050914] text-white selection:bg-brand-primary/30">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <Iridescence color={color || [0.06, 0.23, 0.44]} speed={0.8} amplitude={0.12} mouseReact={false} />
      </div>
      <div className="fixed inset-0 bg-black/40 -z-10 pointer-events-none" />

      {/* ── LEFT PANE: Full-Page Cinematic Showcase (Desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen flex-col justify-between p-12 xl:p-16 border-r border-white/10 relative z-10 backdrop-blur-2xl bg-white/[0.02]">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-[16px] bg-white/15 border border-white/30 flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] group-hover:bg-white/25 transition-all">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">Campus Coin</span>
              <span className="text-[10px] text-white/60 font-semibold tracking-wider uppercase block">NextGen Student Finance</span>
            </div>
          </Link>

          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Free Demo Ready
          </span>
        </div>

        {/* Central Visual Stage */}
        <div className="my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold text-white/80 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Zero manual bank linking required</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6">
            Master university finances without the stress.
          </h2>

          <p className="text-base text-white/70 leading-relaxed mb-8">
            Effortlessly monitor living allowances, set category limits, and unlock automated AI spending tips with zero transaction fees.
          </p>

          {/* Frosted VisionOS Metric Card Mockup */}
          <div className="rounded-[28px] bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-[64px] backdrop-saturate-[200%] border border-white/20 border-b-white/5 border-r-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_0_rgba(0,0,0,0.2)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Monthly Student Budget</p>
                <p className="text-2xl font-black text-white mt-0.5">$1,500.00</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 72% Safe Burn Rate
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/70">
                <span>Campus Dining & Groceries</span>
                <span className="font-semibold text-white">$435.50 / $600</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full w-[72%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature List Footer */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 text-xs text-white/70 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant Free Student Demo</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Automated Statements</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>AI Spending Recommendations</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>256-Bit Encrypted Security</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE: Full-Page Authentication Terminal ── */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between px-6 sm:px-12 xl:px-20 py-10 relative z-10 overflow-y-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-6">
          <Link
            to="/"
            className="min-h-[44px] px-4 flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20"
          >
            <ChevronLeft className="w-4 h-4" /> Return to Home
          </Link>

          <button
            type="button"
            onClick={() => handleQuickDemo("student")}
            className="min-h-[44px] px-4 flex items-center gap-2 text-xs font-bold text-emerald-300 rounded-full bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Explore Free Demo
          </button>
        </div>

        {/* Auth Content Card */}
        <div className="my-auto py-8 max-w-[460px] w-full mx-auto">
          {/* Header Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              <AnimatePresence mode="wait">
                <motion.span key={isLogin ? "login-title" : "reg-title"} className="block">
                  <AnimatedHeading text={isLogin ? "Welcome back" : "Create account"} />
                </motion.span>
              </AnimatePresence>
            </h1>
            <p className="text-sm text-white/70 font-medium">
              {isLogin
                ? "Sign in to access your finances and track your monthly budget."
                : "Create your student account to get started with zero bank linking."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="relative flex p-1.5 min-h-[50px] rounded-full bg-white/10 border border-white/20 mb-6">
            <motion.div
              layoutId="authTabBg"
              className="absolute inset-y-1.5 rounded-full bg-white/25 border border-white/30 shadow-sm"
              style={{ left: isLogin ? "6px" : "50%", width: "calc(50% - 6px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`relative flex-1 min-h-[40px] text-xs font-bold rounded-full z-10 cursor-pointer transition-colors flex items-center justify-center ${
                isLogin ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`relative flex-1 min-h-[40px] text-xs font-bold rounded-full z-10 cursor-pointer transition-colors flex items-center justify-center ${
                !isLogin ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogle}
            className="w-full min-h-[50px] rounded-[18px] bg-white hover:bg-white/95 active:scale-[0.98] text-slate-900 text-sm font-bold shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Or with student email</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* Traditional Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <FloatInput
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInput}
                required
                autoComplete="name"
                icon={User}
              />
            )}

            <FloatInput
              label="Student Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInput}
              required
              autoComplete="email"
              icon={Mail}
            />

            <div>
              <FloatInput
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInput}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                icon={Lock}
              />
              {isLogin && (
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[50px] mt-2 rounded-[18px] bg-white/90 hover:bg-white active:scale-[0.98] text-slate-900 text-sm font-black tracking-tight shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-white/15 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                100% Free Demo Access
              </span>
              <span className="text-white/50 text-[11px]">Instant 0ms preview</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickDemo("student")}
                className="min-h-[46px] rounded-[16px] bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("admin")}
                className="min-h-[46px] rounded-[16px] bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Security / Privacy Badge */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© 2026 Campus Coin. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/" className="hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
