/**
 * SplitAuthPage — Visually matches the Landing Page design system EXACTLY
 * Landing tokens: Manrope, oklch colors, orbit rings, grid overlay, bento surfaces
 * ALL LOGIC 100% UNCHANGED — only UI layer is new
 */
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { auth, googleProvider, signInWithPopup } from "../../core/firebaseClient";
import api from "../../core/api";
import {
  ArrowRight, Eye, EyeOff, Lock, Mail, User,
  ChevronLeft, CheckCircle2, TrendingUp, Sparkles,
  BadgeCheck, ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

/* ─── Landing page design tokens ─── */
const C = {
  hero:        "oklch(0.115 0.018 255)",
  heroFg:      "oklch(0.985 0.003 250)",
  heroMuted:   "oklch(0.73 0.018 252)",
  heroLine:    "oklch(0.31 0.025 255)",
  brand:       "oklch(0.59 0.22 262)",
  highlight:   "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth:      "oklch(0.64 0.17 157)",
  growthSoft:  "oklch(0.94 0.05 158)",
  background:  "oklch(0.99 0.003 250)",
  border:      "oklch(0.9 0.012 255)",
  muted:       "oklch(0.5 0.025 255)",
  cardOrbit:   "oklch(0.61 0.23 290)",
  cardSun:     "oklch(0.83 0.17 70)",
};
const M = { fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" };

/* ─── Brand mark — exact copy from LandingPage ─── */
function BrandMark({ size = 32 }) {
  return (
    <span aria-hidden="true" style={{
      position:"relative", display:"inline-flex", flexShrink:0,
      width:size, height:size,
      border:`${size*0.2}px solid ${C.brand}`,
      borderRightColor:"transparent",
      borderRadius:999, transform:"rotate(-12deg)",
    }}>
      <span style={{ position:"absolute", width:size*.22, height:size*.22, borderRadius:999, background:C.highlight, left:size*.16, top:size*.16 }} />
      <span style={{ position:"absolute", width:size*.28, height:size*.28, borderRadius:999, background:C.growth, right:-size*.17, top:-size*.12 }} />
    </span>
  );
}

function Logo({ size = 32 }) {
  return (
    <Link to="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
      <BrandMark size={size} />
      <span style={{ ...M, fontSize:size*.56, fontWeight:800, color:C.heroFg, letterSpacing:"-0.01em" }}>
        Campus<span style={{ color:C.brand }}>Coin</span>
      </span>
    </Link>
  );
}

/* ─── Animated heading — same as landing ─── */
function AnimatedHeading({ text }) {
  return (
    <span style={{ display:"inline-flex", flexWrap:"wrap" }} aria-label={text}>
      {text.split("").map((c, i) => (
        <motion.span key={i}
          initial={{ opacity:0, y:14, filter:"blur(4px)" }}
          animate={{ opacity:1, y:0, filter:"blur(0px)" }}
          transition={{ duration:0.35, delay:i*0.022, ease:[0.22,1,0.36,1] }}
          style={{ whiteSpace:c===" "?"pre":"normal" }}>
          {c}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Input — dark surface, Lovable spacing ─── */
function FloatInput({ label, name, type="text", value, onChange, required, autoComplete, icon:Icon, error }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const isPass  = type === "password";
  const filled  = value?.length > 0;
  const float   = focused || filled;

  const borderColor = error
    ? "oklch(0.65 0.22 27)"
    : focused
    ? C.brand
    : "oklch(0.24 0.02 255)";

  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ position:"relative" }}>
        {Icon && <Icon style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", width:16, color: focused ? C.brand : "oklch(0.45 0.02 255)", pointerEvents:"none", transition:"color .2s" }} />}
        <input
          name={name}
          type={isPass ? (show ? "text" : "password") : type}
          value={value} onChange={onChange} required={required} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder=" "
          style={{
            ...M, display:"block", width:"100%", boxSizing:"border-box",
            minHeight:58, paddingLeft:Icon?44:16, paddingRight:isPass?50:16,
            paddingTop:22, paddingBottom:8, borderRadius:8,
            border:`1.5px solid ${borderColor}`,
            background: focused ? "oklch(0.16 0.022 255)" : "oklch(0.145 0.018 255)",
            color:C.heroFg, fontSize:14, outline:"none",
            transition:"all .18s",
            boxShadow: focused ? `0 0 0 3px oklch(0.59 0.22 262 / .18)` : "none",
          }}
        />
        <label style={{
          position:"absolute", pointerEvents:"none",
          left:Icon?44:16, transition:"all .18s", ...M,
          ...(float
            ? { top:7, fontSize:10, fontWeight:700, color: focused ? C.brand : C.heroMuted, textTransform:"uppercase", letterSpacing:"0.09em" }
            : { top:"50%", transform:"translateY(-50%)", fontSize:14, color:"oklch(0.42 0.02 255)" }),
        }}>{label}</label>
        {isPass && (
          <button type="button" onClick={() => setShow(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.heroMuted, display:"flex", padding:8 }}>
            {show ? <EyeOff style={{ width:16 }} /> : <Eye style={{ width:16 }} />}
          </button>
        )}
      </div>
      <div style={{ height:20, paddingLeft:4, paddingTop:2 }}>
        {error && <span style={{ ...M, fontSize:11, color:"oklch(0.65 0.22 27)" }}>{error}</span>}
      </div>
    </div>
  );
}

/* ─── Landing-page style submit button ─── */
function SubmitBtn({ loading, label }) {
  return (
    <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.015 }} whileTap={{ scale:.97 }}
      style={{ ...M, width:"100%", height:52, borderRadius:999, border:"none", cursor:"pointer",
        background: C.highlight, color:C.highlightFg,
        fontSize:15, fontWeight:800, letterSpacing:"-0.01em",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        opacity: loading ? .6 : 1,
        boxShadow:`0 8px 32px oklch(0.88 0.18 157 / .35)`,
        transition:"box-shadow .2s",
      }}>
      {loading
        ? <span style={{ width:18, height:18, border:"2.5px solid rgba(0,0,0,.2)", borderTopColor:C.highlightFg, borderRadius:"50%", display:"block", animation:"spin .7s linear infinite" }} />
        : <><span>{label}</span><ArrowRight style={{ width:18, strokeWidth:2.5 }} /></>}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT — ALL LOGIC 100% UNCHANGED
   Only JSX structure & styling updated
════════════════════════════════════════════════ */
export default function SplitAuthPage({ defaultMode = "login" }) {
  const [searchParams] = useSearchParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, loading: contextLoading, login: setAuthSession } = useAuth();
  const { color }      = useTheme();
  const isAuthLoading  = authLoading !== undefined ? authLoading : contextLoading;

  const [isLogin, setIsLogin] = useState(() => {
    if (searchParams.get("mode") === "register" || location.pathname === "/register") return false;
    if (searchParams.get("mode") === "login"    || location.pathname === "/login")    return true;
    return defaultMode === "login";
  });
  const [formData, setFormData] = useState({ name:"", email:"", password:"" });
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading)
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
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
    if (!isLogin && (!formData.name || formData.name.trim().length < 2))
      errs.name = "Full name must be at least 2 characters.";
    if (!formData.email || !formData.email.includes("@"))
      errs.email = "Please enter a valid student email address.";
    if (!formData.password || formData.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    let t = null;
    const timeout = new Promise((_, r) => { t = setTimeout(() => r(new Error("Authentication request timed out after 40 seconds. Please verify your connection.")), 40000); });
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
      if (msg.toLowerCase().includes("password")) setErrors(p => ({ ...p, password:msg }));
      else if (msg.toLowerCase().includes("email")) setErrors(p => ({ ...p, email:msg }));
      else toast.error(msg);
    } finally { if (t) clearTimeout(t); setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    let t = null;
    const timeout = new Promise((_, r) => { t = setTimeout(() => r(new Error("Google login timed out after 40 seconds.")), 40000); });
    try {
      await Promise.race([
        (async () => {
          const result  = await signInWithPopup(auth, googleProvider);
          const idToken = await result.user.getIdToken();
          try {
            const { data } = await api.post("/auth/google/login", { idToken });
            if (data.success) { handleAuthSuccess(data.user, data.token, `Welcome, ${data.user.name.split(" ")[0]}!`); return; }
          } catch (loginErr) {
            if (loginErr.response?.status === 404) {
              const { data } = await api.post("/auth/google/register", { idToken });
              if (data.success) { handleAuthSuccess(data.user, data.token, `Welcome, ${data.user.name.split(" ")[0]}!`); return; }
            }
            throw loginErr;
          }
        })(),
        timeout,
      ]);
    } catch (err) {
      const code = err.code;
      if      (code === "auth/popup-closed-by-user")    toast.error("Google sign-in popup was closed before completion.");
      else if (code === "auth/popup-blocked")           toast.error("Popup was blocked by your browser. Please enable popups for this site.");
      else if (code === "auth/unauthorized-domain")     toast.error("Domain unauthorized in Firebase. Please add localhost to Authorized Domains in Firebase console.");
      else if (code === "auth/cancelled-popup-request") toast.error("Another sign-in popup is already open. Please try again.");
      else toast.error(err.response?.data?.message || err.message || "Google authentication failed.");
    } finally { if (t) clearTimeout(t); setLoading(false); }
  };

  const videoUrl       = import.meta.env.VITE_UNIVERSITY_VIDEO_URL;
  const fallbackPoster = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80";

  /* ── RENDER ── */
  return (
    <div style={{ ...M, minHeight:"100svh", background:C.hero, color:C.heroFg, overflowX:"hidden", position:"relative" }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulseO  { 0%,100%{opacity:.5} 50%{opacity:1} }
      `}</style>

      {/* ── Background: landing-page grid overlay ── */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:`linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
        backgroundSize:"72px 72px", opacity:.12,
        WebkitMaskImage:"linear-gradient(to bottom,black 40%,transparent 90%)",
        maskImage:"linear-gradient(to bottom,black 40%,transparent 90%)",
      }} />

      {/* ── Decorative orbit rings — white + brand like landing hero ── */}
      <div style={{ position:"fixed", top:-60, right:-100, width:520, height:520, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)", opacity:1, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", top:80, right:60, width:300, height:300, borderRadius:"50%", border:`1px solid ${C.brand}`, opacity:.18, pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:-80, left:-60, width:380, height:380, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)", opacity:1, pointerEvents:"none", zIndex:0 }} />
      {/* Extra white ring — landing page uses multiple overlapping rings */}
      <div style={{ position:"fixed", top:"30%", left:-120, width:440, height:440, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.05)", pointerEvents:"none", zIndex:0 }} />

      {/* ── Glow blobs ── */}
      <div style={{ position:"fixed", top:"10%", right:"8%", width:280, height:280, borderRadius:"50%", background:`oklch(0.88 0.18 157 / .08)`, filter:"blur(60px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"15%", left:"5%", width:240, height:240, borderRadius:"50%", background:`oklch(0.59 0.22 262 / .10)`, filter:"blur(50px)", pointerEvents:"none", zIndex:0 }} />

      {/* ── Floating chips (same as landing hero) ── */}
      <motion.div animate={{ y:[0,-10,0] }} transition={{ duration:5, repeat:Infinity, ease:"easeInOut" }}
        style={{ position:"fixed", top:"18%", right:"4%", zIndex:2, display:"none", alignItems:"center", gap:8,
          border:`1px solid ${C.heroLine}`, borderRadius:999, background:"oklch(0.16 0.025 255 / .92)",
          padding:"9px 14px", fontSize:11, fontWeight:700, color:C.heroFg,
          backdropFilter:"blur(12px)", ...M }}
        className="hidden lg:flex">
        <BadgeCheck style={{ width:14, color:C.highlight }} /> Verified student
      </motion.div>
      <motion.div animate={{ y:[0,10,0] }} transition={{ duration:6, repeat:Infinity, ease:"easeInOut", delay:1 }}
        style={{ position:"fixed", bottom:"22%", right:"5%", zIndex:2, display:"none", alignItems:"center", gap:8,
          border:`1px solid ${C.heroLine}`, borderRadius:999, background:"oklch(0.16 0.025 255 / .92)",
          padding:"9px 14px", fontSize:11, fontWeight:700, color:C.heroFg,
          backdropFilter:"blur(12px)", ...M }}
        className="hidden lg:flex">
        <TrendingUp style={{ width:14, color:C.growth }} /> +12% saved
      </motion.div>

      {/* ── Page layout ── */}
      <div style={{ position:"relative", zIndex:1, minHeight:"100svh", display:"grid" }} className="lg:grid-cols-2">

        {/* ── LEFT PANEL (desktop only) ── */}
        <div style={{ position:"relative", overflow:"hidden" }} className="hidden lg:flex lg:flex-col">
          {/* Video */}
          <video autoPlay loop muted playsInline poster={fallbackPoster} src={videoUrl}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:.35 }} />
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, oklch(0.115 0.018 255 / .85) 0%, oklch(0.115 0.018 255 / .6) 100%)` }} />

          <div style={{ position:"relative", zIndex:1, padding:"40px 52px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
            <Logo size={34} />

            {/* Big headline — landing page typography */}
            <div>
              <div style={{ ...M, display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999,
                border:`1px solid ${C.heroLine}`, background:"rgba(255,255,255,0.06)",
                fontSize:11, fontWeight:700, color:`${C.heroFg}CC`, marginBottom:28, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                <Sparkles style={{ width:13, color:C.highlight }} /> Built around student life
              </div>
              <h2 style={{ ...M, fontSize:"clamp(2.2rem,3.5vw,3.4rem)", fontWeight:900, lineHeight:.96,
                letterSpacing:"-0.025em", marginBottom:24, color:C.heroFg }}>
                Master university finances{" "}
                <span style={{ color:C.highlight }}>without</span> the stress.
              </h2>
              <p style={{ ...M, fontSize:15, lineHeight:1.7, color:C.heroMuted, maxWidth:420, marginBottom:36 }}>
                Effortlessly monitor allowances, set category limits, and unlock AI spending tips with zero transaction fees.
              </p>

              {/* Feature pills */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {["Automated Statements","AI Spending Tips","256-Bit Security","Zero Bank Linking"].map(f => (
                  <span key={f} style={{ ...M, display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:999,
                    border:`1px solid ${C.heroLine}`, background:"rgba(255,255,255,0.04)", fontSize:12, color:C.heroMuted, fontWeight:600 }}>
                    <CheckCircle2 style={{ width:13, color:C.growth }} />{f}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ ...M, fontSize:12, color:"rgba(255,255,255,0.45)" }}>© 2026 Campus Coin. All rights reserved.</p>
          </div>
        </div>

        {/* ── RIGHT PANEL: auth form ── */}
        <div style={{ display:"flex", flexDirection:"column", padding:"32px 24px", overflowY:"auto" }}>

          {/* Top bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:40 }}>
            <Link to="/"
              style={{ ...M, display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:C.heroMuted, textDecoration:"none",
                padding:"8px 14px", borderRadius:999, border:`1px solid ${C.heroLine}`, background:"rgba(255,255,255,0.03)",
                transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.color=C.heroFg; e.currentTarget.style.borderColor=C.heroMuted; }}
              onMouseLeave={e => { e.currentTarget.style.color=C.heroMuted; e.currentTarget.style.borderColor=C.heroLine; }}>
              <ChevronLeft style={{ width:14 }} /> Home
            </Link>
            <div className="lg:hidden"><Logo size={26} /></div>
          </div>

          {/* Form container */}
          <div style={{ margin:"auto 0", width:"100%", maxWidth:440, alignSelf:"center" }}>

            {/* Heading — landing typography */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5, ease:[.22,1,.36,1] }}
              style={{ marginBottom:28 }}>
              {/* Eyebrow */}
              <div style={{ ...M, fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, marginBottom:14 }}>
                {isLogin ? "Student Portal" : "Join CampusCoin"}
              </div>
              <h1 style={{ ...M, fontSize:"clamp(2rem,5vw,2.8rem)", fontWeight:900, lineHeight:.93, letterSpacing:"-0.03em", marginBottom:12 }}>
                <AnimatePresence mode="wait">
                  <motion.span key={isLogin ? "lt" : "rt"} style={{ display:"block" }}>
                    <AnimatedHeading text={isLogin ? "Welcome back" : "Create account"} />
                  </motion.span>
                </AnimatePresence>
              </h1>
              <p style={{ ...M, fontSize:14, lineHeight:1.65, color:C.heroMuted, fontWeight:500 }}>
                {isLogin
                  ? <>Sign in to access your <span style={{ color:C.heroFg, fontWeight:700 }}>finances</span> and track your monthly budget.</>
                  : <>Start your <span style={{ color:C.highlight, fontWeight:700 }}>student finance</span> journey in under 30 seconds.</>}
              </p>
            </motion.div>

            {/* Tab switcher — same pill as landing nav */}
            <div style={{ position:"relative", display:"flex", padding:5, borderRadius:999,
              border:`1px solid ${C.heroLine}`, background:"rgba(255,255,255,0.04)", marginBottom:24 }}>
              <motion.div layoutId="authPill"
                style={{ position:"absolute", insetBlock:5, borderRadius:999,
                  background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.2)",
                  left: isLogin ? 5 : "50%", width:"calc(50% - 5px)" }}
                transition={{ type:"spring", stiffness:420, damping:32 }} />
              {[["Sign In", true], ["Create Account", false]].map(([lbl, toLogin]) => (
                <button key={String(toLogin)} type="button" onClick={() => switchMode(toLogin)}
                  style={{ ...M, flex:1, height:40, borderRadius:999, border:"none", background:"transparent",
                    cursor:"pointer", fontSize:13, fontWeight:700, position:"relative", zIndex:1,
                    color: isLogin===toLogin ? C.heroFg : C.heroMuted, transition:"color .15s" }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Google button */}
            <motion.button type="button" disabled={loading} onClick={handleGoogle}
              whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale:.98 }}
              style={{ ...M, width:"100%", height:52, borderRadius:8, background:"#fff", border:"none",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                fontSize:14, fontWeight:700, color:"#1a1a2e", marginBottom:18,
                opacity:loading?.5:1, boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </motion.button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ flex:1, height:1, background:C.heroLine }} />
              <span style={{ ...M, fontSize:11, color:C.heroMuted, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>Or email</span>
              <div style={{ flex:1, height:1, background:C.heroLine }} />
            </div>

            {/* Form — ALL LOGIC UNCHANGED */}
            <AnimatePresence mode="wait" initial={false}>
              {isLogin ? (
                <motion.form key="login" initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:10 }} transition={{ duration:.22 }} onSubmit={handleFormSubmit}>
                  <FloatInput label="Student Email" name="email" type="email" value={formData.email} onChange={handleCustomInput} required autoComplete="email" icon={Mail} error={errors.email} />
                  <div>
                    <FloatInput label="Password" name="password" type="password" value={formData.password} onChange={handleCustomInput} required autoComplete="current-password" icon={Lock} error={errors.password} />
                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:-8, marginBottom:20 }}>
                      <Link to="/forgot-password" style={{ ...M, fontSize:12, color:C.brand, textDecoration:"none", fontWeight:600 }}>Forgot password?</Link>
                    </div>
                  </div>
                  <SubmitBtn loading={loading} label="Sign In" />
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:-10 }} transition={{ duration:.22 }} onSubmit={handleFormSubmit}>
                  <FloatInput label="Full Name" name="name" type="text" value={formData.name} onChange={handleCustomInput} required autoComplete="name" icon={User} error={errors.name} />
                  <FloatInput label="Student Email" name="email" type="email" value={formData.email} onChange={handleCustomInput} required autoComplete="email" icon={Mail} error={errors.email} />
                  <FloatInput label="Password (min 6 chars)" name="password" type="password" value={formData.password} onChange={handleCustomInput} required autoComplete="new-password" icon={Lock} error={errors.password} />
                  <div style={{ marginTop:8 }}>
                    <SubmitBtn loading={loading} label="Create Account" />
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer note */}
            <p style={{ ...M, marginTop:20, fontSize:12, color:C.heroMuted, textAlign:"center", lineHeight:1.6 }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => switchMode(!isLogin)}
                style={{ ...M, background:"none", border:"none", cursor:"pointer", color:C.highlight, fontWeight:700, fontSize:12, padding:0 }}>
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
