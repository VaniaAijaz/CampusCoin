import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { auth, googleProvider, signInWithPopup } from "../../core/firebaseClient";
import api from "../../core/api";
import Iridescence from "../../components/ui/Iridescence";
import {
  Coins, Eye, EyeOff, ArrowRight, Sparkles,
  Shield, UserCheck, ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Animated heading — chars stagger in ── */
function AnimatedHeading({ text, className = "" }) {
  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
          transition={{ duration: 0.35, delay: i * 0.022, ease: [0.22, 1, 0.36, 1] }}
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

/* ── Floating label input ── */
function FloatInput({ label, name, type = "text", value, onChange, required, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const filled = value?.length > 0;
  const float = focused || filled;

  return (
    <div className="relative">
      <input
        name={name}
        type={isPassword ? (show ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`peer w-full px-4 pt-5 pb-2.5 rounded-[14px] bg-white/10
                    border text-sm text-white outline-none transition-all duration-200
                    placeholder-transparent
                    ${focused
                      ? "border-white/60 bg-white/15 shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                      : "border-white/20 hover:border-white/35"
                    }
                    ${isPassword ? "pr-11" : ""}`}
        placeholder={label}
      />
      {/* Floating label */}
      <label
        className={`absolute left-4 pointer-events-none transition-all duration-200 font-medium
                    ${float
                      ? "top-2 text-[10px] text-white/50 tracking-wider uppercase"
                      : "top-1/2 -translate-y-1/2 text-sm text-white/40"
                    }`}
      >
        {label}
      </label>
      {/* Show/hide password */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
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
  const { user, isAuthenticated, isLoading: authLoading, loading: contextLoading, login: setAuthSession } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : contextLoading;

  const [isLogin, setIsLogin] = useState(() => {
    if (searchParams.get("mode") === "register" || location.pathname === "/register") return false;
    if (searchParams.get("mode") === "login"    || location.pathname === "/login")    return true;
    return defaultMode === "login";
  });

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading,  setLoading]  = useState(false);

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

  const handleQuickDemo = async (role) => {
    setLoading(true);
    const creds = role === "admin"
      ? { email: "admin@campuscoin.com",   password: "CC_Adm!n#2026$x" }
      : { email: "student@campuscoin.com", password: "CC_Stu#2026$x" };
    try {
      const { data } = await api.post("/auth/login", creds);
      if (data.success) { handleAuthSuccess(data.user, data.token, `Welcome, ${data.user.name}!`); return; }
    } catch {
      const fallback = role === "admin"
        ? { _id:"demo-admin",   name:"Campus Coin Admin",  email:"admin@campuscoin.com",   role:"admin",   isActive:true }
        : { _id:"demo-student", name:"Alex Rivera",        email:"student@campuscoin.com", role:"student", academicYear:"Junior (Year 3)", monthlyAllowanceBaseline:1500, monthlySavingsGoal:300, currency:"USD", isActive:true };
      handleAuthSuccess(fallback, "demo-mock-jwt", `Welcome to Campus Coin, ${fallback.name}!`);
    } finally { setLoading(false); }
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
      const { data } = await api.post(isLogin ? "/auth/login" : "/auth/register", formData);
      if (data.success) handleAuthSuccess(data.user, data.token, `Welcome ${data.user.name.split(" ")[0]}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post(isLogin ? "/auth/google/login" : "/auth/google/register", { idToken });
      if (data.success) handleAuthSuccess(data.user, data.token, `Welcome ${data.user.name.split(" ")[0]}!`);
    } catch (err) {
      if (err.response?.status === 404 && isLogin)  toast.error("Account not found. Please sign up.");
      else if (err.response?.status === 409 && !isLogin) toast.error("Account exists. Please sign in.");
      else toast.error("Google sign-in failed.");
    } finally { setLoading(false); }
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    navigate(toLogin ? "/login" : "/register", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">

      {/* Iridescence background */}
      <div className="fixed inset-0 -z-20">
        <Iridescence color={[1, 1, 1]} speed={1.0} amplitude={0.1} mouseReact={false} />
      </div>
      <div className="fixed inset-0 bg-black/20 -z-10" />

      {/* Back to home */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Home
      </Link>

      {/* Brand mark top right */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div className="w-7 h-7 rounded-[10px] bg-white/20 border border-white/30 flex items-center justify-center">
          <Coins className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-black text-white tracking-tight">Campus Coin</span>
      </div>

      {/* ── Main card ── */}
      <motion.div
        key={isLogin ? "login" : "register"}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: -16, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] rounded-[28px]
                   bg-white/15 backdrop-blur-[48px] backdrop-saturate-[200%]
                   border border-white/25
                   shadow-[0_32px_80px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.05)]
                   overflow-hidden"
        style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
      >
        {/* Card header strip */}
        <div className="px-8 pt-8 pb-6 border-b border-white/10">
          <h1 className="text-[28px] font-black text-white tracking-tight leading-none mb-1.5"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            <AnimatePresence mode="wait">
              <motion.span key={isLogin ? "login-title" : "reg-title"} className="block">
                <AnimatedHeading text={isLogin ? "Welcome back" : "Create account"} />
              </motion.span>
            </AnimatePresence>
          </h1>
          <motion.p
            key={isLogin ? "login-sub" : "reg-sub"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="text-sm text-white/50 font-medium mt-1.5"
          >
            {isLogin ? "Sign in to your student dashboard." : "Start tracking your finances today."}
          </motion.p>
        </div>

        <div className="px-8 py-6 space-y-5">

          {/* Tab switcher */}
          <div className="relative flex p-1 rounded-[14px] bg-white/8 border border-white/12">
            <motion.div
              layoutId="authTabBg"
              className="absolute inset-y-1 rounded-[10px] bg-white/20 border border-white/25 shadow-sm"
              style={{ left: isLogin ? "4px" : "50%", width: "calc(50% - 4px)" }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
            <button
              onClick={() => switchMode(true)}
              className={`relative flex-1 py-2 text-xs font-bold rounded-[10px] z-10 cursor-pointer transition-colors
                ${isLogin ? "text-white" : "text-white/45 hover:text-white/70"}`}
            >Sign In</button>
            <button
              onClick={() => switchMode(false)}
              className={`relative flex-1 py-2 text-xs font-bold rounded-[10px] z-10 cursor-pointer transition-colors
                ${!isLogin ? "text-white" : "text-white/45 hover:text-white/70"}`}
            >Sign Up</button>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2.5
                       bg-white hover:bg-white/90 active:scale-[0.98]
                       text-slate-800 text-sm font-bold rounded-[14px]
                       shadow-[0_4px_16px_rgba(0,0,0,0.15)]
                       transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/12" />
            <span className="text-[11px] text-white/35 font-semibold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/12" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <FloatInput
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInput}
                    required
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <FloatInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInput}
              required
              autoComplete="email"
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
              />
              {isLogin && (
                <div className="flex justify-end mt-1.5">
                  <Link to="/forgot-password" className="text-[11px] text-white/45 hover:text-white/80 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-1 rounded-[14px]
                         bg-white/90 hover:bg-white active:scale-[0.98]
                         text-slate-900 text-sm font-black tracking-tight
                         shadow-[0_8px_32px_rgba(255,255,255,0.2)]
                         transition-all disabled:opacity-50 cursor-pointer
                         flex items-center justify-center gap-2"
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

          {/* Demo buttons */}
          <div className="pt-1 border-t border-white/10 space-y-2.5">
            <p className="text-[10px] text-white/35 text-center font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300/70" /> Quick Demo Access
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo("student")}
                className="flex-1 py-2.5 rounded-[12px] bg-white/8 hover:bg-white/15
                           border border-white/15 hover:border-white/25
                           text-[11px] font-bold text-white/70 hover:text-white
                           flex items-center justify-center gap-1.5
                           transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Student
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo("admin")}
                className="flex-1 py-2.5 rounded-[12px] bg-white/8 hover:bg-white/15
                           border border-white/15 hover:border-white/25
                           text-[11px] font-bold text-white/70 hover:text-white
                           flex items-center justify-center gap-1.5
                           transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Admin
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
