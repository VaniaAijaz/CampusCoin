import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, PieChart,
  BarChart3, Tag, User, LogOut,
  BookOpen, Bell, X, Repeat, ChevronRight,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import TransactionModal from "../features/transactions/TransactionModal";
import DemoNoticeModal from "../components/ui/DemoNoticeModal";
import AdSenseInterstitialModal from "../components/ads/AdSenseInterstitialModal";
import api from "./api";

const C = {
  hero:        "oklch(0.115 0.018 255)",
  heroFg:      "oklch(0.985 0.003 250)",
  heroMuted:   "oklch(0.73 0.018 252)",
  heroLine:    "oklch(0.31 0.025 255)",
  brand:       "oklch(0.59 0.22 262)",
  brandSoft:   "oklch(0.93 0.06 262)",
  highlight:   "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth:      "oklch(0.64 0.17 157)",
  growthSoft:  "oklch(0.94 0.05 158)",
  background:  "oklch(0.99 0.003 250)",
  foreground:  "oklch(0.16 0.025 260)",
  muted:       "oklch(0.5 0.025 255)",
  border:      "oklch(0.9 0.012 255)",
};
const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};
export const SPRING_CONFIG = { type:"spring", stiffness:400, damping:35, mass:0.8, bounce:0 };

function BrandMark() {
  return (
    <span aria-hidden="true" style={{
      position:"relative", display:"inline-flex",
      width:30, height:30, flexShrink:0,
      border:`6px solid ${C.brand}`,
      borderRightColor:"transparent",
      borderRadius:999,
      transform:"rotate(-12deg)",
    }}>
      <span style={{ position:"absolute", width:7, height:7, borderRadius:999, background:C.highlight, left:4, top:4 }} />
      <span style={{ position:"absolute", width:9, height:9, borderRadius:999, background:C.growth, right:-5.5, top:-4 }} />
    </span>
  );
}

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { color } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [quickAddOpen,       setQuickAddOpen]      = useState(false);
  const [demoModalOpen,      setDemoModalOpen]      = useState(false);
  const [announcements,      setAnnouncements]      = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [bannerDismissed,    setBannerDismissed]    = useState(false);
  const [bellOpen,           setBellOpen]           = useState(false);
  const [isMobile,           setIsMobile]           = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const h = () => setDemoModalOpen(true);
    window.addEventListener("campuscoin:demoBlocked", h);
    return () => window.removeEventListener("campuscoin:demoBlocked", h);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/announcements").then(({ data }) => {
      if (data.success && data.announcements?.length) {
        setAnnouncements(data.announcements);
        setActiveAnnouncement(data.announcements[0]);
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = false;
    const reg = () => { active = true; };
    ["mousemove","scroll","keydown","touchstart"].forEach(e => window.addEventListener(e, reg, { passive:true }));
    api.post("/users/heartbeat").catch(() => {});
    const t = setInterval(() => {
      if (active) { api.post("/users/heartbeat").catch(() => {}); active = false; }
    }, 60000);
    return () => {
      clearInterval(t);
      ["mousemove","scroll","keydown","touchstart"].forEach(e => window.removeEventListener(e, reg));
    };
  }, [isAuthenticated]);

  const navLinks = [
    { to:"/app",               label:"Overview",      icon:LayoutDashboard, end:true },
    { to:"/app/transactions",  label:"Transactions",  icon:ArrowLeftRight },
    { to:"/app/khata",         label:"Khata",         icon:BookOpen },
    { to:"/app/budget",        label:"Budget",        icon:PieChart },
    { to:"/app/subscriptions", label:"Subscriptions", icon:Repeat },
    { to:"/app/reports",       label:"Reports",       icon:BarChart3 },
    { to:"/app/categories",    label:"Categories",    icon:Tag },
    { to:"/app/profile",       label:"Profile",       icon:User },
  ];

  const doLogout = async () => {
    try { await api.post("/users/logout-session"); } catch (_) {}
    logout(); navigate("/login");
  };

  const SidebarContent = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", ...M }}>
      <div style={{ padding:"22px 20px 16px", borderBottom:`1px solid ${C.heroLine}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <BrandMark />
          <span style={{ fontSize:18, fontWeight:800, color:C.heroFg, letterSpacing:"-0.01em" }}>
            Campus<span style={{ color:C.highlight }}>Coin</span>
          </span>
        </div>
        <p style={{ fontSize:10, color:C.heroMuted, marginTop:4, fontWeight:500 }}>A Finance App For Students</p>
      </div>

      {user && (
        <div style={{ margin:"14px 12px 4px", padding:"12px 13px", borderRadius:8, background:"rgba(255,255,255,0.06)", border:`1px solid ${C.heroLine}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:C.brand, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>
            {user.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.heroFg, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</p>
            <p style={{ fontSize:10, color:C.heroMuted, margin:0 }}>{user.role==="admin" ? "Platform Admin" : user.academicYear||"Student"}</p>
          </div>
        </div>
      )}

      <nav style={{ flex:1, overflowY:"auto", padding:"10px 8px" }}>
        <NavGroup label="Main"  links={navLinks.slice(0,4)} location={location} />
        <NavGroup label="Tools" links={navLinks.slice(4)}  location={location} />
      </nav>

      <div style={{ padding:"10px 10px 20px", borderTop:`1px solid ${C.heroLine}` }}>
        <button onClick={doLogout} style={{
          display:"flex", alignItems:"center", gap:9, width:"100%",
          padding:"9px 14px", borderRadius:999,
          background:"transparent", border:`1px solid ${C.heroLine}`,
          color:C.heroMuted, fontSize:13, fontWeight:600, cursor:"pointer", ...M, transition:"all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.color=C.heroFg; }}
          onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.heroMuted; }}
        >
          <LogOut style={{ width:14 }} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.background, ...M }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{
          position:"fixed", top:0, left:0, bottom:0, width:248,
          background:C.hero, zIndex:40,
          display:"flex", flexDirection:"column",
          backgroundImage:`linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
          backgroundSize:"48px 48px",
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* Main */}
      <div style={{ marginLeft:isMobile ? 0 : 248, display:"flex", flexDirection:"column", minHeight:"100vh" }}>

        {/* Header */}
        <header style={{
          position:"sticky", top:0, zIndex:30,
          background:"rgba(255,255,255,0.96)", backdropFilter:"blur(14px)",
          borderBottom:`1px solid ${C.border}`,
          height:60, padding:"0 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
        }}>
          <p style={{ fontSize:13, color:C.muted, margin:0, fontWeight:500 }}>
            {new Date().toLocaleString("default", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative" }}>
              <button onClick={() => setBellOpen(o=>!o)} style={{
                width:36, height:36, borderRadius:"50%",
                border:`1px solid ${C.border}`, background:"#fff", color:C.muted,
                display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
              }}>
                <Bell style={{ width:15 }} />
                {announcements.length > 0 && (
                  <span style={{ position:"absolute", top:7, right:7, width:7, height:7, borderRadius:"50%", background:C.brand }} />
                )}
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <motion.div key="bell"
                    initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                    transition={{ duration:0.15 }}
                    style={{ position:"absolute", right:0, top:44, width:290, background:"#fff", border:`1px solid ${C.border}`, borderRadius:12, padding:14, zIndex:200, boxShadow:"0 8px 32px rgba(0,0,0,0.10)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.foreground }}>Announcements</span>
                      <span style={{ fontSize:11, color:C.muted }}>{announcements.length} active</span>
                    </div>
                    {announcements.length === 0
                      ? <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"10px 0" }}>No announcements.</p>
                      : announcements.map(ann => (
                          <div key={ann._id} style={{ padding:"8px 10px", borderRadius:8, background:C.background, border:`1px solid ${C.border}`, marginBottom:6 }}>
                            <p style={{ fontSize:12, fontWeight:700, color:C.foreground, margin:"0 0 2px" }}>{ann.title}</p>
                            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{ann.message}</p>
                          </div>
                        ))
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink to="/app/profile" style={{
              width:36, height:36, borderRadius:"50%",
              background:C.brandSoft, border:`1.5px solid ${C.brand}40`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:800, color:C.brand, textDecoration:"none",
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </NavLink>
          </div>
        </header>

        {/* Banner */}
        {activeAnnouncement && !bannerDismissed && (
          <div style={{ margin:"10px 20px 0", padding:"8px 14px", borderRadius:8, background:C.brandSoft, border:`1px solid ${C.brand}28`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
            <p style={{ fontSize:12, color:C.foreground, margin:0, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              <strong>{activeAnnouncement.title}:</strong> {activeAnnouncement.message}
            </p>
            <button onClick={() => setBannerDismissed(true)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted }}>
              <X style={{ width:13 }} />
            </button>
          </div>
        )}

        {isMobile && <MobileBottomNav navLinks={navLinks} />}

        <main style={{ flex:1, padding:isMobile ? "16px 16px 80px" : "28px 28px 32px", maxWidth:1280, width:"100%", margin:"0 auto" }}>
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" transition={{ duration:0.18, ease:"easeOut" }}>
              <Outlet context={{ openQuickAdd: () => setQuickAddOpen(true) }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => { setQuickAddOpen(false); window.dispatchEvent(new CustomEvent("campuscoin:txUpdated")); }}
      />
      <DemoNoticeModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
      <AdSenseInterstitialModal />
    </div>
  );
}

function NavGroup({ label, links, location }) {
  return (
    <div style={{ marginTop:12, marginBottom:4 }}>
      <p style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.13em", textTransform:"uppercase", color:C.heroMuted, padding:"0 10px 6px", margin:0, opacity:0.7 }}>{label}</p>
      {links.map(item => <SideNavItem key={item.to} item={item} />)}
    </div>
  );
}

function SideNavItem({ item }) {
  const { icon:Icon, to, label, end } = item;
  return (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display:"flex", alignItems:"center", gap:10,
      padding:"9px 12px", borderRadius:999, marginBottom:2,
      fontSize:13, fontWeight: isActive ? 700 : 500,
      color: isActive ? C.highlightFg : C.heroMuted,
      background: isActive ? C.highlight : "transparent",
      textDecoration:"none", transition:"all 0.15s", ...M,
    })}>
      {({ isActive }) => (
        <>
          <Icon style={{ width:15, height:15, flexShrink:0, color: isActive ? C.highlightFg : C.heroMuted }} />
          {label}
        </>
      )}
    </NavLink>
  );
}

const MC = { brand:C.brand, soft:C.brandSoft, border:C.border, muted:C.muted, highlight:C.highlight, highlightFg:C.highlightFg };

function MobileBottomNav({ navLinks }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = navLinks.slice(0, 4);
  const extra   = navLinks.slice(4);

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setMoreOpen(false)}
              style={{ position:"fixed", inset:0, zIndex:40, background:"rgba(0,0,0,0.3)" }} />
            <motion.div key="sheet"
              initial={{ y:"100%", opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:"100%", opacity:0 }}
              transition={{ type:"spring", stiffness:380, damping:32 }}
              style={{ position:"fixed", bottom:62, left:10, right:10, zIndex:50, background:"#fff", border:`1.5px solid ${MC.border}`, borderRadius:20, padding:"12px 12px 14px", boxShadow:"0 -4px 24px rgba(0,0,0,0.12)", ...M }}>
              <div style={{ width:30, height:3, background:MC.border, borderRadius:99, margin:"0 auto 12px" }} />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
                {extra.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.to} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
                      <NavLink to={item.to} end={item.end} onClick={() => setMoreOpen(false)}
                        style={({ isActive }) => ({
                          display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                          padding:"10px 6px", borderRadius:12, textDecoration:"none",
                          background: isActive ? MC.soft : "#f7f7fc",
                          border:`1.5px solid ${isActive ? MC.brand+"40" : MC.border}`, ...M,
                        })}>
                        {({ isActive }) => (
                          <>
                            <Icon style={{ width:18, color: isActive ? MC.brand : MC.muted }} />
                            <span style={{ fontSize:10, fontWeight:600, color: isActive ? MC.brand : MC.muted, textAlign:"center" }}>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:40, background:"rgba(255,255,255,0.97)", backdropFilter:"blur(10px)", borderTop:`1.5px solid ${MC.border}`, display:"flex", justifyContent:"space-around", alignItems:"center", padding:"5px 4px 10px", ...M }}>
        {primary.map(item => <MobNavItem key={item.to} item={item} />)}
        {extra.length > 0 && (
          <button onClick={() => setMoreOpen(o=>!o)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"5px 10px", background:"none", border:"none", cursor:"pointer" }}>
            <motion.div animate={{ rotate: moreOpen ? 45 : 0 }} transition={{ type:"spring", stiffness:400, damping:25 }}
              style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {[0,1,2].map(i => <span key={i} style={{ display:"block", width:14, height:1.5, borderRadius:99, background: moreOpen ? MC.brand : MC.muted }} />)}
            </motion.div>
            <span style={{ fontSize:9, fontWeight:600, color: moreOpen ? MC.brand : MC.muted, marginTop:2 }}>More</span>
          </button>
        )}
      </nav>
    </>
  );
}

function MobNavItem({ item }) {
  const { icon:Icon, to, label, end } = item;
  return (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display:"flex", flexDirection:"column", alignItems:"center", gap:2,
      padding:"5px 10px", borderRadius:10, textDecoration:"none",
      background: isActive ? MC.soft : "transparent",
    })}>
      {({ isActive }) => (
        <>
          <Icon style={{ width:18, color: isActive ? MC.brand : MC.muted }} />
          <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500, color: isActive ? MC.brand : MC.muted }}>
            {label.split(" ")[0]}
          </span>
        </>
      )}
    </NavLink>
  );
}
