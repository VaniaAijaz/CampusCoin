import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { auth, googleProvider, signInWithPopup } from "../../core/firebaseClient";
import api from "../../core/api";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ChevronLeft,
  CheckCircle2,
  Send,
  ArrowDownToLine,
  Wallet,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import "./AuthPages.css";

function LogoMark({ size = 34 }) {
  return (
    <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      <span
        style={{
          position: "relative",
          display: "block",
          width: size,
          height: size,
          overflow: "hidden",
          borderRadius: 9,
          backgroundColor: "var(--auth-blue)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "55%",
            borderBottomRightRadius: 11,
            backgroundColor: "var(--auth-blue-soft)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "52%",
            height: "50%",
            backgroundColor: "var(--auth-blue-deep)",
          }}
        />
      </span>
      <span style={{ fontSize: size * 0.62, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--auth-foreground)" }}>
        CampusCoin
      </span>
    </Link>
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
    if (searchParams.get("mode") === "login" || location.pathname === "/login") return true;
    return defaultMode === "login";
  });

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, user, navigate]);

  useEffect(() => {
    if (location.pathname === "/register") setIsLogin(false);
    else if (location.pathname === "/login") setIsLogin(true);
  }, [location.pathname]);

  const handleAuthSuccess = (userData, token, msg) => {
    setAuthSession(userData, token);
    toast.success(msg || `Welcome, ${userData.name}!`);
    navigate(userData.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  };

  const switchMode = (toLogin) => {
    setErrors({});
    setIsLogin(toLogin);
    navigate(toLogin ? "/login" : "/register", { replace: true });
  };

  const handleCustomInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const validateForm = () => {
    const errs = {};
    if (!isLogin && (!formData.name || formData.name.trim().length < 2)) {
      errs.name = "Full name must be at least 2 characters.";
    }
    if (!formData.email || !formData.email.includes("@")) {
      errs.email = "Please enter a valid student email address.";
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    let t = null;
    const timeout = new Promise((_, r) => {
      t = setTimeout(
        () => r(new Error("Authentication request timed out. Please verify your connection.")),
        40000
      );
    });

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const { data } = await Promise.race([api.post(endpoint, formData), timeout]);
      if (data.success) {
        if (!isLogin) {
          toast.success("Account created! A 6-digit verification code has been dispatched to your email.");
          navigate(`/verify?email=${encodeURIComponent(formData.email)}`, { replace: true });
        } else {
          handleAuthSuccess(data.user, data.token, `Welcome back, ${data.user.name.split(" ")[0]}!`);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Authentication failed.";
      if (msg.toLowerCase().includes("password")) setErrors((p) => ({ ...p, password: msg }));
      else if (msg.toLowerCase().includes("email")) setErrors((p) => ({ ...p, email: msg }));
      else toast.error(msg);
    } finally {
      if (t) clearTimeout(t);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    let t = null;
    const timeout = new Promise((_, r) => {
      t = setTimeout(() => r(new Error("Google login timed out after 40 seconds.")), 40000);
    });

    try {
      await Promise.race([
        (async () => {
          const result = await signInWithPopup(auth, googleProvider);
          const idToken = await result.user.getIdToken();
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
        })(),
        timeout,
      ]);
    } catch (err) {
      const code = err.code;
      if (code === "auth/popup-closed-by-user") toast.error("Google sign-in popup was closed before completion.");
      else if (code === "auth/popup-blocked") toast.error("Popup was blocked by your browser. Please enable popups.");
      else if (code === "auth/unauthorized-domain") toast.error("Domain unauthorized in Firebase console.");
      else if (code === "auth/cancelled-popup-request") toast.error("Another sign-in popup is already open.");
      else toast.error(err.response?.data?.message || err.message || "Google authentication failed.");
    } finally {
      if (t) clearTimeout(t);
      setLoading(false);
    }
  };

  return (
    <main className="auth-root">
      {/* Background Ambience */}
      <div className="auth-grid-bg" />
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      <div className="auth-split-grid">
        {/* ── Left Showcase Panel (Desktop) ── */}
        <section className="auth-showcase-panel" aria-label="CampusCoin benefits">
          <div className="auth-showcase-top">
            <LogoMark size={36} />
          </div>

          <div className="auth-showcase-content">
            <div className="auth-showcase-pill">
              <Sparkles style={{ width: 14, height: 14 }} />
              Student Financial Freedom
            </div>

            <h1 className="auth-showcase-heading">
              Smarter money for your <span style={{ color: "var(--auth-blue)" }}>campus life.</span>
            </h1>

            <p className="auth-showcase-desc">
              Track daily allowances, split expenses with roommates, and master your student budget with zero stress.
            </p>

            {/* Mini 3D Floating Wallet Showcase */}
            <div className="auth-mini-wallet-container">
              <div className="auth-mini-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 800 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      background: "linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.6) 50%)",
                    }}
                  />
                  CampusCoin
                </div>

                <div style={{ marginTop: 14, fontSize: 11, opacity: 0.88, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Campus Wallet
                </div>

                <div style={{ marginTop: 3, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  ₹ 2,48,500
                </div>

                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Send style={{ width: 12, height: 12 }} /> Send
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowDownToLine style={{ width: 12, height: 12 }} /> Receive
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Wallet style={{ width: 12, height: 12 }} /> Pay
                  </span>
                </div>
              </div>

              <div className="auth-mini-notice">
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: "#bbf7d0",
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowDownToLine style={{ width: 13, height: 13 }} />
                </span>
                <div>
                  <strong style={{ display: "block", fontSize: 12, fontWeight: 700 }}>+ ₹75.00 received</strong>
                  <span style={{ fontSize: 10, color: "var(--auth-muted)" }}>Instant Campus Transfer</span>
                </div>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="auth-feature-badges">
              <span className="auth-feature-badge">
                <ShieldCheck style={{ width: 14, height: 14, color: "var(--auth-blue)" }} /> 256-Bit Security
              </span>
              <span className="auth-feature-badge">
                <CheckCircle2 style={{ width: 14, height: 14, color: "#16a34a" }} /> Zero Bank Linking
              </span>
              <span className="auth-feature-badge">
                <Sparkles style={{ width: 14, height: 14, color: "var(--auth-blue)" }} /> AI Categorization
              </span>
            </div>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--auth-muted)", margin: 0 }}>
            © 2026 Campus Coin. All rights reserved.
          </p>
        </section>

        {/* ── Right Form Panel ── */}
        <section className="auth-form-panel" aria-label="Authentication form">
          {/* Top Navigation */}
          <div className="auth-top-nav">
            <Link to="/" className="auth-back-link">
              <ChevronLeft style={{ width: 16, height: 16 }} />
              Back to Home
            </Link>
            <div style={{ display: "flex", alignItems: "center" }} className="lg:hidden">
              <LogoMark size={30} />
            </div>
          </div>

          {/* Form Container */}
          <div className="auth-form-box">
            {/* Header */}
            <div className="auth-form-header">
              <div className="auth-badge-kicker">{isLogin ? "Student Portal" : "Join CampusCoin"}</div>
              <h2 className="auth-form-title">{isLogin ? "Welcome back" : "Create account"}</h2>
              <p className="auth-form-subtitle">
                {isLogin
                  ? "Sign in to access your finances and monthly spending."
                  : "Start your student finance journey in under 30 seconds."}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="auth-tab-switcher">
              <div
                className="auth-tab-active-indicator"
                style={{
                  left: isLogin ? "4px" : "calc(50% + 2px)",
                  width: "calc(50% - 6px)",
                }}
              />
              <button
                type="button"
                className={`auth-tab-btn ${isLogin ? "active" : ""}`}
                onClick={() => switchMode(true)}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${!isLogin ? "active" : ""}`}
                onClick={() => switchMode(false)}
              >
                Create Account
              </button>
            </div>

            {/* Google One-Click Auth */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogle}
              className="auth-google-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">Or continue with email</span>
              <span className="auth-divider-line" />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleFormSubmit} noValidate>
              <AnimatePresence mode="wait" initial={false}>
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="auth-input-group">
                      <label className="auth-input-label" htmlFor="auth-name">
                        Full Name
                      </label>
                      <div className="auth-input-wrapper">
                        <User className="auth-input-icon" style={{ width: 17, height: 17 }} />
                        <input
                          id="auth-name"
                          name="name"
                          type="text"
                          placeholder="e.g. Ali Khan"
                          value={formData.name}
                          onChange={handleCustomInput}
                          autoComplete="name"
                          className={`auth-input-field ${errors.name ? "error" : ""}`}
                        />
                      </div>
                      {errors.name && <div className="auth-input-error">{errors.name}</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="auth-email">
                  Student Email
                </label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" style={{ width: 17, height: 17 }} />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    placeholder="student@university.edu"
                    value={formData.email}
                    onChange={handleCustomInput}
                    autoComplete="email"
                    className={`auth-input-field ${errors.email ? "error" : ""}`}
                  />
                </div>
                {errors.email && <div className="auth-input-error">{errors.email}</div>}
              </div>

              <div className="auth-input-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="auth-input-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  {isLogin && (
                    <Link
                      to="/forgot-password"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--auth-blue)",
                        textDecoration: "none",
                      }}
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" style={{ width: 17, height: 17 }} />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleCustomInput}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className={`auth-input-field ${errors.password ? "error" : ""}`}
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                {errors.password && <div className="auth-input-error">{errors.password}</div>}
              </div>

              <button type="submit" disabled={loading} className="auth-submit-btn">
                {loading ? (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#ffffff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Note */}
            <p className="auth-footer-note">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="auth-footer-btn"
                onClick={() => switchMode(!isLogin)}
              >
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          <div style={{ height: 10 }} />
        </section>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
