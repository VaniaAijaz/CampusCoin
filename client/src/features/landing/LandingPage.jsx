/**
 * LandingPage — Lovable design replica
 * Font: Manrope (matches Lovable's --font-sans)
 * No glassmorphism. No Iridescence.
 * Existing functionality (enterDemoMode, routes) preserved.
 */
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown, ArrowRight, BadgeCheck, ChevronRight,
  CircleDollarSign, Eye, EyeOff, Fingerprint,
  GraduationCap, Menu, ShieldCheck, Sparkles,
  Split, Store, TrendingUp, WalletCards, X,
  Receipt,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

gsap.registerPlugin(ScrollTrigger);

/* ─── Design tokens (mirror Lovable CSS vars) ─── */
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
  foreground:  "oklch(0.16 0.025 260)",
  muted:       "oklch(0.5 0.025 255)",
  border:      "oklch(0.9 0.012 255)",
  cardOrbit:   "oklch(0.61 0.23 290)",
  cardSun:     "oklch(0.83 0.17 70)",
};

const MANROPE = { fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" };

const navItems = [
  { label: "Product",  href: "#product"   },
  { label: "Benefits", href: "#benefits"  },
  { label: "Campus",   href: "#campus"    },
  { label: "Security", href: "#security"  },
];

const benefits = [
  { icon: ShieldCheck, n: "01", title: "Protected by design",       copy: "Freeze your card instantly, verify every payment, and stay in control with real-time alerts." },
  { icon: TrendingUp,  n: "02", title: "A budget that thinks ahead", copy: "See what's safe to spend after rent, fees, and subscriptions—before the month gets expensive." },
  { icon: WalletCards, n: "03", title: "One balance, every campus",  copy: "Pay at cafés, bookstores, societies, and events from one student-first digital wallet." },
];

const transactions = [
  { icon: Store,       name: "Campus Café",    meta: "Today · Food",       amount: "− $8.40"  },
  { icon: Split,       name: "Maya paid you",  meta: "Today · Split bill",  amount: "+ $24.00", positive: true },
  { icon: Receipt,     name: "Bookstore",       meta: "Yesterday · Study",   amount: "− $32.90" },
];

const testimonials = [
  { quote: "I finally know what I can spend without checking three different apps.", name: "Maya · 2nd year"   },
  { quote: "Splitting house bills takes seconds now. No spreadsheets, no chasing.", name: "Noah · Postgrad"   },
  { quote: "The campus card is the first student product that actually feels premium.", name: "Zara · 1st year" },
  { quote: "Saving for summer happens quietly in the background. That's the best part.", name: "Leo · Final year" },
];

/* ─── Lovable Logo (BrandMark circle + wordmark) ─── */
function Logo({ inverse = false }) {
  const textColor = inverse ? C.heroFg : C.foreground;
  return (
    <a href="#top" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", color:textColor }}>
      <BrandMark inverse={inverse} />
      <span style={{ ...MANROPE, fontSize:18, fontWeight:800, color:textColor, letterSpacing:"-0.01em" }}>
        Campus<span style={{ color:C.brand }}>Coin</span>
      </span>
    </a>
  );
}
function BrandMark({ inverse = false }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative", display: "inline-flex",
        width: 32, height: 32, flexShrink: 0,
        border: `6.5px solid ${inverse ? C.heroFg : C.brand}`,
        borderRightColor: "transparent",
        borderRadius: 999,
        transform: "rotate(-12deg)",
      }}
    >
      {/* Core dot */}
      <span style={{ position:"absolute", width:7, height:7, borderRadius:999, background:C.highlight, left:5, top:5 }} />
      {/* Accent dot */}
      <span style={{ position:"absolute", width:9, height:9, borderRadius:999, background:C.growth, right:-5.5, top:-4 }} />
    </span>
  );
}

/* ─── Animated payment card (card-float CSS anim) ─── */
function PaymentCard({ style }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: 250, aspectRatio: "1.62",
      borderRadius: "1.25rem", padding: "1.6rem",
      background: `linear-gradient(135deg, oklch(0.9 0.13 190), oklch(0.81 0.18 290) 48%, oklch(0.88 0.18 70))`,
      boxShadow: "0 45px 90px -35px rgba(0,0,0,0.7)",
      ...style,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <BrandMark />
          <span style={{ ...MANROPE, fontSize:14, fontWeight:800, color:C.cardOrbit }}>CampusCoin</span>
        </div>
        {/* Contactless rings */}
        <div style={{ width:20, height:26, borderRight:`2px solid ${C.foreground}`, borderRadius:"50%", opacity:.7, position:"relative" }} />
      </div>
      <div style={{ marginTop:"auto", display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <p style={{ ...MANROPE, fontSize:11, fontWeight:600, color:`${C.cardOrbit}99` }}>STUDENT</p>
          <p style={{ ...MANROPE, marginTop:4, fontSize:13, fontWeight:700, color:C.cardOrbit }}>AVA CARTER</p>
        </div>
        <div style={{ display:"flex", marginRight:-8 }}>
          <span style={{ width:32, height:32, borderRadius:"50%", background:`${C.cardOrbit}D9` }} />
          <span style={{ width:32, height:32, borderRadius:"50%", background:`${C.cardSun}D9`, marginLeft:-12 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Phone mockup ─── */
function PhonePreview() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  return (
    <div style={{
      width: "min(310px, 82vw)",
      border: `8px solid ${C.hero}`,
      borderRadius: "2.65rem",
      background: C.hero,
      padding: 3,
      boxShadow: `0 40px 80px -30px oklch(0.15 0.03 260 / .48)`,
    }}>
      <div style={{
        minHeight: 590, borderRadius: "2.15rem",
        background: C.background, color: C.foreground,
        padding: "1.1rem 1.1rem 1.35rem",
        ...MANROPE,
      }}>
        {/* Dynamic Island */}
        <div style={{ width:72, height:20, margin:"-0.55rem auto 0", borderRadius:999, background:C.hero }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:28 }}>
          <div>
            <p style={{ fontSize:12, color:C.muted }}>Good morning</p>
            <p style={{ fontWeight:700 }}>Ava</p>
          </div>
          <div style={{ width:36, height:36, borderRadius:"50%", background:`oklch(0.95 0.025 255)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:12, fontWeight:700 }}>AC</span>
          </div>
        </div>
        <div style={{ marginTop:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, color:C.muted }}>
            <span style={{ fontSize:12, fontWeight:500 }}>Available balance</span>
            <button type="button" onClick={() => setBalanceVisible(v=>!v)}
              style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              aria-label={balanceVisible ? "Hide balance" : "Show balance"}>
              {balanceVisible ? <Eye style={{ width:14, color:C.muted }} /> : <EyeOff style={{ width:14, color:C.muted }} />}
            </button>
          </div>
          <p style={{ marginTop:4, fontSize:30, fontWeight:800 }}>{balanceVisible ? "$1,248.60" : "••••••••"}</p>
        </div>
        {/* Quick actions */}
        <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[[ArrowRight,"Send"],[ArrowDown,"Add"],[Split,"Split"]].map(([Icon, label]) => (
            <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"10px 0", borderRadius:16, background:`oklch(0.955 0.008 250)`, fontSize:12, fontWeight:600 }}>
              <Icon style={{ width:16, color:C.growth }} />
              {label}
            </div>
          ))}
        </div>
        {/* Transactions */}
        <div style={{ marginTop:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h3 style={{ fontSize:14, fontWeight:700 }}>Recent activity</h3>
          <span style={{ fontSize:12, fontWeight:600, color:C.growth }}>See all</span>
        </div>
        <div style={{ marginTop:8 }}>
          {transactions.map(item => (
            <div key={item.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0" }}>
              <span style={{ width:36, height:36, borderRadius:"50%", background:`oklch(0.955 0.008 250)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <item.icon style={{ width:16 }} />
              </span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
                <span style={{ display:"block", fontSize:10, color:C.muted }}>{item.meta}</span>
              </span>
              <span style={{ fontSize:12, fontWeight:700, color:item.positive ? C.growth : C.foreground }}>{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab component ─── */
function Tabs({ tabs, defaultValue, children }) {
  const [active, setActive] = useState(defaultValue);
  const content = children.find?.(c => c.props?.value === active);
  return (
    <div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.value} type="button" onClick={() => setActive(t.value)}
            style={{
              ...MANROPE, padding:"10px 16px", borderRadius:999,
              border: `1px solid ${active===t.value ? C.foreground : C.border}`,
              background: "transparent", cursor:"pointer",
              fontSize:13, fontWeight:600,
              color: active===t.value ? C.foreground : C.muted,
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop:28 }}>{content}</div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { enterDemoMode } = useAuth();
  const containerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLaunchFreeDemo = () => {
    enterDemoMode();
    navigate("/dashboard");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-word", { y: 40, opacity: 0, stagger: 0.05, duration: 1.0, ease: "power4.out", delay: 0.15 });
      gsap.from(".hero-sub",  { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.45 });
      gsap.from(".hero-visual-col", { x: 60, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.3 });
      gsap.from(".benefit-item", {
        scrollTrigger: { trigger: ".benefit-grid", start: "top 80%" },
        y: 40, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out",
      });
      gsap.from(".feature-block-anim", {
        scrollTrigger: { trigger: ".feature-bento", start: "top 80%" },
        y: 50, opacity: 0, stagger: 0.1, duration: 0.8, ease: "back.out(1.2)",
      });
      gsap.from(".testimonial-item", {
        scrollTrigger: { trigger: ".testimonials-grid", start: "top 80%" },
        y: 30, opacity: 0, stagger: 0.08, duration: 0.7, ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const headlineWords = ["Money,", "mastered", "for", "campus", "life."];

  return (
    <div ref={containerRef} style={{ ...MANROPE, overflowX:"hidden", background:C.background, color:C.foreground }}>

      {/* ── HERO SECTION ── */}
      <section style={{ background: C.hero, color: C.heroFg, position:"relative", paddingBottom:40 }}>
        {/* Grid overlay */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none", opacity:.16,
          backgroundImage: `linear-gradient(${C.heroLine} 1px, transparent 1px), linear-gradient(90deg, ${C.heroLine} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 90%)",
          maskImage: "linear-gradient(to bottom, black, transparent 90%)",
        }} />

        {/* Nav */}
        <header style={{
          position:"relative", zIndex:20, maxWidth:1280, margin:"0 auto",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"20px 32px",
        }}>
          <Logo inverse />

          {/* Desktop nav — only on md+ */}
          {!isMobile && (
            <nav aria-label="Main">
              <div style={{ display:"flex", alignItems:"center", gap:32 }}>
                {navItems.map(n => (
                  <a key={n.label} href={n.href}
                    style={{ ...MANROPE, fontSize:12, fontWeight:600, color:C.heroMuted, textDecoration:"none", letterSpacing:"0.02em", transition:"color 0.15s" }}
                    onMouseEnter={e => e.target.style.color=C.heroFg}
                    onMouseLeave={e => e.target.style.color=C.heroMuted}>
                    {n.label}
                  </a>
                ))}
              </div>
            </nav>
          )}

          {/* Desktop buttons — only on md+ */}
          {!isMobile && (
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Link to="/login"
                style={{ ...MANROPE, fontSize:14, fontWeight:600, color:C.heroFg, textDecoration:"none", padding:"10px 20px", borderRadius:999, minHeight:44, display:"inline-flex", alignItems:"center", background:"transparent", border:"none", transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background=`oklch(0.985 0.003 250 / 0.10)`}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                Log in
              </Link>
              <Link to="/register"
                style={{ ...MANROPE, fontSize:14, fontWeight:700, color:C.highlightFg, background:C.highlight, padding:"10px 20px", borderRadius:999, textDecoration:"none", height:40, display:"inline-flex", alignItems:"center", gap:6, transition:"background 0.15s", whiteSpace:"nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.background="oklch(0.82 0.18 157)"; }}
                onMouseLeave={e => { e.currentTarget.style.background=C.highlight; }}>
                Get CampusCoin <ArrowRight style={{ width:15, strokeWidth:2.5 }} />
              </Link>
            </div>
          )}

          {/* Mobile hamburger — only on mobile */}
          {isMobile && (
            <button type="button" onClick={() => setMenuOpen(v=>!v)}
              style={{ width:40, height:40, borderRadius:"50%", border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.heroMuted }}
              aria-label="Toggle menu">
              {menuOpen ? <X style={{ width:20, color:C.heroFg }} /> : <Menu style={{ width:20, color:C.heroFg }} />}
            </button>
          )}
        </header>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ position:"absolute", left:16, right:16, top:80, zIndex:30, borderRadius:8, border:`1px solid ${C.heroLine}`, background:C.hero, padding:20, boxShadow:"0 20px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {navItems.map(n => (
                <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)}
                  style={{ ...MANROPE, padding:"12px", fontSize:14, fontWeight:700, color:C.heroFg, textDecoration:"none" }}>
                  {n.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setMenuOpen(false)}
                style={{ ...MANROPE, padding:"12px", fontSize:14, fontWeight:700, color:C.heroFg, textDecoration:"none" }}>
                Log in
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                style={{ ...MANROPE, marginTop:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 0", borderRadius:999, background:C.highlight, color:C.highlightFg, fontSize:14, fontWeight:800, textDecoration:"none" }}>
                Get CampusCoin <ArrowRight style={{ width:16 }} />
              </Link>
            </div>
          </div>
        )}

        {/* Hero content */}
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"56px 20px 80px", display:"grid", gap:48, alignItems:"center" }} className="md:grid-cols-[1.08fr_.92fr]">
          {/* Left: text */}
          <div style={{ maxWidth:720 }}>
            <div className="hero-sub" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:999, border:`1px solid ${C.heroLine}`, fontSize:12, fontWeight:600, color:C.heroMuted, marginBottom:32 }}>
              <Sparkles style={{ width:14, color:C.highlight }} /> Built around student life
            </div>

            <h1 style={{ ...MANROPE, fontSize:"clamp(3.4rem,7.5vw,7.2rem)", fontWeight:900, lineHeight:.89, letterSpacing:"-0.03em", color:C.heroFg, display:"flex", flexWrap:"wrap", gap:"0 14px" }}>
              {headlineWords.map((w,i) => (
                <span key={i} style={{ overflow:"hidden", display:"inline-block", padding:"4px 0" }}>
                  <span className="hero-word" style={{ display:"inline-block" }}>{w}</span>
                </span>
              ))}
            </h1>

            <p className="hero-sub" style={{ ...MANROPE, marginTop:32, maxWidth:480, fontSize:17, lineHeight:1.7, color:C.heroMuted, fontWeight:500 }}>
              Pay, split, save, and stay ahead of every semester—all in one secure student wallet.
            </p>

            <div className="hero-sub" style={{ marginTop:32, display:"flex", flexWrap:"wrap", alignItems:"center", gap:12 }}>
              <Link to="/register" style={{ ...MANROPE, height:48, display:"inline-flex", alignItems:"center", gap:8, padding:"0 28px", borderRadius:999, background:C.highlight, color:C.highlightFg, fontSize:16, fontWeight:800, textDecoration:"none" }}>
                Open your account <ArrowRight style={{ width:16 }} />
              </Link>
              <button type="button" onClick={handleLaunchFreeDemo}
                style={{ ...MANROPE, height:48, display:"inline-flex", alignItems:"center", gap:8, padding:"0 28px", borderRadius:999, border:`1px solid ${C.heroLine}`, background:"transparent", color:C.heroFg, fontSize:16, fontWeight:700, cursor:"pointer" }}>
                See how it works
              </button>
            </div>
          </div>

          {/* Right: hero visual */}
          <div className="hero-visual-col" style={{ position:"relative", margin:"0 auto", height:580, width:"100%", maxWidth:600 }}>
            {/* Orbit rings — larger */}
            <div style={{ position:"absolute", width:500, height:500, right:-100, top:10, border:`1px solid ${C.heroLine}`, borderRadius:"50%" }} />
            <div style={{ position:"absolute", width:320, height:320, left:-10, bottom:20, border:`1px solid ${C.brand}`, borderRadius:"50%", opacity:.5 }} />

            {/* Floating chips */}
            <div style={{ position:"absolute", left:0, top:"6%", zIndex:5, display:"flex", alignItems:"center", gap:8, border:`1px solid ${C.heroLine}`, borderRadius:999, background:`oklch(0.16 0.025 255 / .92)`, padding:"9.6px 13.6px", fontSize:10.9, fontWeight:700, backdropFilter:"blur(12px)", color:C.heroFg, ...MANROPE }}>
              <BadgeCheck style={{ width:15, color:C.highlight }} /> Verified student
            </div>

            {/* Animated payment card — zIndex:4 so it overlaps chart panel */}
            <style>{`
              @keyframes card-float {
                0%,100% { transform: rotateX(58deg) rotateZ(-19deg) translate3d(0,0,0); }
                50%      { transform: rotateX(58deg) rotateZ(-17deg) translate3d(0,-13px,15px); }
              }
              @media (prefers-reduced-motion: reduce) { .hero-card-anim { animation: none !important; } }
            `}</style>
            <div className="hero-card-anim" style={{
              position:"absolute", left:"2%", top:"5%", zIndex:4,
              width:"min(92%, 510px)",
              animation: "card-float 7s ease-in-out infinite",
              perspective: "1100px",
            }}>
              <PaymentCard />
            </div>

            {/* Chart panel — larger, zIndex:3 so card floats above it */}
            <div style={{
              position:"absolute", bottom:"-5%", right:"2%", zIndex:3,
              width:250, height:400,
              border:`1px solid ${C.heroLine}`,
              borderRadius:"2.2rem 2.2rem 0 0",
              padding:"1.8rem 1.6rem 0",
              background:"oklch(0.13 0.022 255)",
              transform:"rotate(8deg)",
              color:C.heroFg,
              ...MANROPE,
              overflow:"hidden",
            }}>
              <p style={{ fontSize:20, color:C.heroMuted, fontWeight:600 }}>This month</p>
              <p style={{ marginTop:6, fontSize:38, fontWeight:800, letterSpacing:"-0.02em" }}>$642.18</p>

              {/* Bar chart */}
              <div style={{ marginTop:24, height:160, display:"flex", alignItems:"flex-end", gap:6, position:"relative" }}>
                {[38,56,42,68,50,80,62,90,72].map((h,i) => (
                  <span key={i} style={{
                    flex:1, display:"block", borderRadius:"4px 4px 0 0",
                    background:"oklch(0.72 0.19 157)",
                    height:`${h}%`,
                  }} />
                ))}

                {/* +12% saved chip */}
                <div style={{
                  position:"absolute", right:0, top:"10%",
                  display:"inline-flex", alignItems:"center", gap:6,
                  background:"oklch(0.18 0.025 255)",
                  borderRadius:999, padding:"8px 14px",
                  fontSize:12, fontWeight:700, color:C.heroFg,
                  whiteSpace:"nowrap",
                  boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
                }}>
                  <TrendingUp style={{ width:13, color:"oklch(0.72 0.19 157)", strokeWidth:2.5 }} />
                  +12% saved
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-down arrow — Lovable exact: highlight circle, border=hero bg, centered, translateY 50% */}
        <div style={{ display:"flex", justifyContent:"center", paddingBottom:0, position:"relative", zIndex:10, marginTop:8 }}>
          <a href="#product" aria-label="Scroll down"
            style={{
              width:72, height:72, borderRadius:"50%",
              border:`5px solid ${C.hero}`,
              background:C.highlight,
              color:C.highlightFg,
              display:"flex", alignItems:"center", justifyContent:"center",
              transform:"translateY(50%)",
              textDecoration:"none",
              zIndex:10,
              boxShadow:`0 0 0 4px ${C.hero}`,
            }}>
            <ArrowDown style={{ width:26, height:26, strokeWidth:2.5 }} />
          </a>
        </div>
      </section>

      {/* ── PRODUCT / BENEFITS ── */}
      <section id="product" style={{ padding:"clamp(5rem,10vw,8rem) 0", paddingTop:"calc(clamp(5rem,10vw,8rem) + 40px)", background:C.background }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"grid", gap:32, borderBottom:`1px solid ${C.border}`, paddingBottom:48 }} className="md:grid-cols-[.75fr_1.25fr]">
            <p style={{ ...MANROPE, fontSize:11.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand }}>A better money app</p>
            <h2 style={{ ...MANROPE, fontSize:"clamp(2.3rem,5vw,4.8rem)", fontWeight:900, lineHeight:.98, letterSpacing:0 }}>
              Your finances should feel clear—not like another exam.
            </h2>
          </div>
          <div className="benefit-grid" style={{ display:"grid" }} className="grid md:grid-cols-3">
            {benefits.map((b, i) => (
              <div key={b.title} className="benefit-item" style={{
                minHeight:360, padding:"clamp(1.5rem,4vw,2.6rem)",
                borderBottom: `1px solid ${C.border}`,
                borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ width:44, height:44, borderRadius:"50%", background:`oklch(0.95 0.025 255)`, display:"flex", alignItems:"center", justifyContent:"center", color:C.brand }}>
                    <b.icon style={{ width:20 }} />
                  </span>
                  <span style={{ ...MANROPE, fontSize:12, fontWeight:700, color:C.muted }}>{b.n}</span>
                </div>
                <h3 style={{ ...MANROPE, marginTop:64, fontSize:24, fontWeight:800 }}>{b.title}</h3>
                <p style={{ ...MANROPE, marginTop:16, maxWidth:320, fontSize:14, lineHeight:1.6, color:C.muted }}>{b.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP STAGE (phone + tabs) ── */}
      <section id="benefits" style={{ padding:"clamp(5rem,10vw,8rem) 0", background:`oklch(0.965 0.01 254)` }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px", display:"grid", alignItems:"center", gap:64 }} className="lg:grid-cols-[.9fr_1.1fr]">
          {/* App stage */}
          <div style={{ position:"relative", minHeight:620 }}>
            {/* Green glow */}
            <div style={{ position:"absolute", inset:"12% 4% 5%", borderRadius:"50%", background:C.highlight, opacity:.72, filter:"blur(1px)" }} />
            {/* Budget card */}
            <div className="hidden sm:block" style={{ position:"absolute", left:0, top:80, width:280, transform:"rotate(-8deg)", borderRadius:12, background:C.hero, padding:20, color:C.heroFg, boxShadow:"0 20px 40px rgba(0,0,0,0.3)", zIndex:1, ...MANROPE }}>
              <p style={{ fontSize:12, color:C.heroMuted }}>Safe to spend</p>
              <p style={{ marginTop:8, fontSize:32, fontWeight:800 }}>$286.40</p>
              <div style={{ marginTop:32, height:8, borderRadius:999, overflow:"hidden", background:C.heroLine }}>
                <div style={{ height:"100%", width:"75%", background:C.growth }} />
              </div>
              <div style={{ marginTop:16, display:"flex", justifyContent:"space-between", fontSize:10, color:C.heroMuted }}>
                <span>Spent $413</span><span>Budget $700</span>
              </div>
            </div>
            {/* Phone */}
            <div style={{ position:"absolute", right:0, top:0, zIndex:2 }}>
              <PhonePreview />
            </div>
            {/* Cashback chip */}
            <div style={{ position:"absolute", bottom:12, left:80, zIndex:3, borderRadius:12, border:`1px solid ${C.border}`, background:C.background, padding:16, boxShadow:"0 8px 24px rgba(0,0,0,0.08)", ...MANROPE }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ width:40, height:40, borderRadius:"50%", background:`oklch(0.94 0.05 158)`, display:"flex", alignItems:"center", justifyContent:"center", color:C.growth }}>
                  <CircleDollarSign style={{ width:20 }} />
                </span>
                <div>
                  <p style={{ fontSize:12, color:C.muted }}>Cashback earned</p>
                  <p style={{ fontWeight:800 }}>$42.80</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: tabs */}
          <div style={{ ...MANROPE }}>
            <p style={{ fontSize:11.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand }}>Built for real student life</p>
            <h2 style={{ marginTop:20, fontSize:"clamp(2.3rem,5vw,4.8rem)", fontWeight:900, lineHeight:.98 }}>
              Know where your money is going. Before it goes.
            </h2>
            <p style={{ marginTop:24, maxWidth:560, fontSize:16, lineHeight:1.7, color:C.muted }}>
              CampusCoin turns everyday spending into a clear plan. Your essentials, shared costs, and goals stay visible in one calm, secure place.
            </p>
            <div style={{ marginTop:40 }}>
              <Tabs defaultValue="budget" tabs={[{value:"budget",label:"Smart budget"},{value:"split",label:"Split bills"},{value:"rewards",label:"Rewards"}]}>
                <div value="budget" style={{ borderLeft:`2px solid ${C.brand}`, paddingLeft:20 }}>
                  <h3 style={{ fontWeight:800 }}>A live safe-to-spend number</h3>
                  <p style={{ marginTop:8, fontSize:14, lineHeight:1.6, color:C.muted }}>CampusCoin accounts for rent, tuition plans, and upcoming subscriptions automatically.</p>
                </div>
                <div value="split" style={{ borderLeft:`2px solid ${C.growth}`, paddingLeft:20 }}>
                  <h3 style={{ fontWeight:800 }}>Settle shared costs in seconds</h3>
                  <p style={{ marginTop:8, fontSize:14, lineHeight:1.6, color:C.muted }}>Split groceries, society fees, or a group dinner without awkward reminders.</p>
                </div>
                <div value="rewards" style={{ borderLeft:`2px solid ${C.highlight}`, paddingLeft:20 }}>
                  <h3 style={{ fontWeight:800 }}>Useful rewards, not noise</h3>
                  <p style={{ marginTop:8, fontSize:14, lineHeight:1.6, color:C.muted }}>Earn at participating campus spots and put rewards straight toward your goals.</p>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAMPUS BENTO ── */}
      <section id="campus" style={{ padding:"clamp(5rem,10vw,8rem) 0", background:C.background }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end", gap:32, marginBottom:56 }}>
            <div>
              <p style={{ ...MANROPE, fontSize:11.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand }}>One wallet. Every day.</p>
              <h2 style={{ ...MANROPE, marginTop:20, fontSize:"clamp(2.3rem,5vw,4.8rem)", fontWeight:900, lineHeight:.98, maxWidth:640 }}>From first coffee to final submission.</h2>
            </div>
            <p style={{ ...MANROPE, maxWidth:320, fontSize:14, lineHeight:1.6, color:C.muted }}>Designed around the moments that actually make up campus life.</p>
          </div>

          <div className="feature-bento" style={{ display:"grid", gap:16 }} className="grid md:grid-cols-12">
            {/* Feature 1 — large blue */}
            <div className="feature-block-anim md:col-span-7" style={{
              minHeight:390, display:"flex", flexDirection:"column", justifyContent:"space-between",
              borderRadius:8, padding:"clamp(1.5rem,4vw,2.6rem)", overflow:"hidden",
              background:`oklch(0.59 0.22 262)`, color:`oklch(0.985 0.003 250)`,
              ...MANROPE,
            }}>
              <div>
                <GraduationCap style={{ width:28 }} />
                <h3 style={{ marginTop:80, maxWidth:380, fontSize:30, fontWeight:800, lineHeight:1.15 }}>Your campus identity meets your everyday wallet.</h3>
              </div>
              <div style={{ marginTop:40, display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:700 }}>
                Pay on campus <ChevronRight style={{ width:16 }} />
              </div>
            </div>

            {/* Feature 2 — dark */}
            <div className="feature-block-anim md:col-span-5" style={{
              minHeight:390, display:"flex", flexDirection:"column", justifyContent:"space-between",
              borderRadius:8, padding:"clamp(1.5rem,4vw,2.6rem)", overflow:"hidden",
              background:C.hero, color:C.heroFg, ...MANROPE,
            }}>
              <Fingerprint style={{ width:28, color:C.highlight }} />
              <div>
                <p style={{ marginTop:80, fontSize:14, color:C.heroMuted }}>Protected access</p>
                <h3 style={{ marginTop:8, fontSize:30, fontWeight:800 }}>You are the password.</h3>
                <p style={{ marginTop:20, fontSize:14, lineHeight:1.6, color:C.heroMuted }}>Biometric approval and instant alerts keep every payment visible.</p>
              </div>
            </div>

            {/* Feature 3 — green soft */}
            <div className="feature-block-anim md:col-span-5" style={{
              minHeight:390, display:"flex", flexDirection:"column", justifyContent:"space-between",
              borderRadius:8, padding:"clamp(1.5rem,4vw,2.6rem)", overflow:"hidden",
              background:C.growthSoft, ...MANROPE,
            }}>
              <TrendingUp style={{ width:28, color:C.growth }} />
              <div>
                <h3 style={{ marginTop:80, fontSize:30, fontWeight:800 }}>Goals that grow with you.</h3>
                <p style={{ marginTop:16, fontSize:14, lineHeight:1.6, color:C.muted }}>Round up purchases or move spare money automatically.</p>
              </div>
            </div>

            {/* Feature 4 — highlight */}
            <div className="feature-block-anim md:col-span-7" style={{
              minHeight:390, display:"flex", flexDirection:"column", justifyContent:"space-between",
              borderRadius:8, padding:"clamp(1.5rem,4vw,2.6rem)", overflow:"hidden",
              background:C.highlight, color:C.highlightFg, ...MANROPE,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <Split style={{ width:28 }} />
                <span style={{ fontSize:12, fontWeight:700 }}>No awkward maths</span>
              </div>
              <div>
                <h3 style={{ marginTop:80, maxWidth:480, fontSize:30, fontWeight:800 }}>Split the bill. Keep the friendship.</h3>
                <div style={{ marginTop:32, display:"flex", marginLeft:-12 }}>
                  {["AC","MK","JL","+2"].map(init => (
                    <span key={init} style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${C.highlight}`, background:C.background, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, marginLeft:-12 }}>{init}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="security" style={{ padding:"clamp(5rem,10vw,8rem) 0", background:C.hero, color:C.heroFg }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px", display:"grid", gap:48 }} className="md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p style={{ ...MANROPE, fontSize:11.5, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.highlight }}>Student trusted</p>
            <h2 style={{ ...MANROPE, marginTop:20, fontSize:"clamp(2.3rem,5vw,4.8rem)", fontWeight:900, lineHeight:.98 }}>Less money stress. More room to live.</h2>
          </div>
          <div className="testimonials-grid" style={{ display:"grid", gap:1, overflow:"hidden", borderRadius:8, background:C.heroLine }} className="grid gap-px overflow-hidden rounded-lg md:grid-cols-2">
            {testimonials.map(t => (
              <figure key={t.name} className="testimonial-item" style={{ background:C.hero, padding:"clamp(1.5rem,4vw,2.25rem)", margin:0, ...MANROPE }}>
                <div style={{ marginBottom:40, display:"flex", gap:4, color:C.highlight, fontSize:14 }}>★★★★★</div>
                <blockquote style={{ fontSize:18, fontWeight:700, lineHeight:1.55, color:C.heroFg }}>"{t.quote}"</blockquote>
                <figcaption style={{ marginTop:32, fontSize:12, color:C.heroMuted }}>{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / DOWNLOAD ── */}
      <section id="download" style={{ position:"relative", overflow:"hidden", padding:"clamp(6rem,12vw,8rem) 0", background:C.highlight, color:C.highlightFg }}>
        {/* Radial lines deco */}
        <div style={{ position:"absolute", inset:"-40%", backgroundImage:"repeating-radial-gradient(circle at center, transparent 0 42px, oklch(0.17 0.04 160 / .12) 43px 44px)", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:896, margin:"0 auto", padding:"0 20px", textAlign:"center" }}>
          <BrandMark />
          <h2 style={{ ...MANROPE, maxWidth:720, margin:"32px auto 0", fontSize:"clamp(3rem,7vw,4.5rem)", fontWeight:900, lineHeight:.95, letterSpacing:"-0.02em" }}>
            Your money era starts here.
          </h2>
          <p style={{ ...MANROPE, maxWidth:480, margin:"24px auto 0", fontSize:14, lineHeight:1.6, color:`${C.highlightFg}B3` }}>
            Join students building calmer, smarter money habits with CampusCoin.
          </p>
          <div style={{ marginTop:36, display:"flex", flexWrap:"wrap", justifyContent:"center", gap:12 }}>
            <Link to="/register" style={{ ...MANROPE, height:56, display:"inline-flex", alignItems:"center", gap:8, padding:"0 28px", borderRadius:999, background:C.hero, color:C.heroFg, fontSize:16, fontWeight:800, textDecoration:"none" }}>
              Open your account <ArrowRight style={{ width:16 }} />
            </Link>
            <button type="button" onClick={handleLaunchFreeDemo}
              style={{ ...MANROPE, height:56, display:"inline-flex", alignItems:"center", gap:8, padding:"0 28px", borderRadius:999, border:`1px solid ${C.highlightFg}40`, background:"transparent", color:C.highlightFg, fontSize:16, fontWeight:700, cursor:"pointer" }}>
              Launch Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:C.hero, color:C.heroFg, padding:"48px 0", ...MANROPE }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:40, borderBottom:`1px solid ${C.heroLine}`, paddingBottom:40 }}>
            <div>
              <Logo inverse />
              <p style={{ marginTop:16, maxWidth:280, fontSize:14, lineHeight:1.6, color:C.heroMuted }}>The modern money account made around student life.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 64px", fontSize:14, color:C.heroMuted }}>
              {navItems.map(n => <a key={n.label} href={n.href} style={{ color:C.heroMuted, textDecoration:"none" }}>{n.label}</a>)}
              <a href="mailto:hello@campuscoin.app" style={{ color:C.heroMuted, textDecoration:"none" }}>Help centre</a>
              <a href="#top" style={{ color:C.heroMuted, textDecoration:"none" }}>Back to top</a>
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", gap:12, paddingTop:28, fontSize:12, color:C.heroMuted }}>
            <p>© 2026 CampusCoin. All rights reserved.</p>
            <p>Student money, made smarter.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
