import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Tag,
  User,
  LogOut,
  BookOpen,
  Bell,
  X,
  Repeat,
  Sparkles,
  Menu,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import TransactionModal from "../features/transactions/TransactionModal";
import DemoNoticeModal from "../components/ui/DemoNoticeModal";
import AdSenseInterstitialModal from "../components/ads/AdSenseInterstitialModal";
import api from "./api";

const C = {
  sidebarBg: "#ffffff",
  sidebarLine: "#e2e8f0",
  sidebarFg: "#0f172a",
  sidebarMuted: "#64748b",
  sidebarHover: "#f8fafc",
  brand: "#2563eb",
  brandSoft: "#eff6ff",
  brandBorder: "#dbeafe",
  brandDeep: "#1d4ed8",
  background: "#f8fafc",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
};

const M = { fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" };

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

function BrandMark({ size = 28 }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          position: "relative",
          display: "block",
          width: size,
          height: size,
          overflow: "hidden",
          borderRadius: 8,
          backgroundColor: "#2563eb",
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
            borderBottomRightRadius: 10,
            backgroundColor: "#93c5fd",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "52%",
            height: "50%",
            backgroundColor: "#1d4ed8",
          }}
        />
      </span>
      <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a" }}>
        CampusCoin
      </span>
    </div>
  );
}

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 1024
  );

  useEffect(() => {
    const h = () => setDemoModalOpen(true);
    window.addEventListener("campuscoin:demoBlocked", h);
    return () => window.removeEventListener("campuscoin:demoBlocked", h);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    ["mousemove", "scroll", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, reg, { passive: true }));
    api.post("/users/heartbeat").catch(() => {});
    const t = setInterval(() => {
      if (active) { api.post("/users/heartbeat").catch(() => {}); active = false; }
    }, 60000);
    return () => {
      clearInterval(t);
      ["mousemove", "scroll", "keydown", "touchstart"].forEach((e) => window.removeEventListener(e, reg));
    };
  }, [isAuthenticated]);

  const navLinks = [
    { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/insights", label: "AI Insights", icon: Sparkles },
    { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
    { to: "/app/khata", label: "Khata", icon: BookOpen },
    { to: "/app/budget", label: "Budget", icon: PieChart },
    { to: "/app/subscriptions", label: "Subscriptions", icon: Repeat },
    { to: "/app/reports", label: "Reports", icon: BarChart3 },
    { to: "/app/categories", label: "Categories", icon: Tag },
    { to: "/app/profile", label: "Profile", icon: User },
  ];

  const doLogout = async () => {
    try { await api.post("/users/logout-session"); } catch (_) {}
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", ...M }}>
      {/* Brand Header */}
      <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${C.sidebarLine}` }}>
        <BrandMark size={30} />
        <p style={{ fontSize: 11.5, color: C.sidebarMuted, marginTop: 5, fontWeight: 600 }}>Student Financial Hub</p>
      </div>

      {/* User Info Card */}
      {user && (
        <div style={{
          margin: "14px 12px 6px",
          padding: "10px 12px",
          borderRadius: 12,
          background: "#f8fafc",
          border: `1px solid ${C.sidebarLine}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
          }}>
            {user.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.sidebarFg, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name}
            </p>
            <p style={{ fontSize: 11, color: C.sidebarMuted, margin: 0 }}>
              {user.role === "admin" ? "Platform Admin" : user.academicYear || "Student"}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Groups */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
        <NavGroup label="Main" links={navLinks.slice(0, 4)} location={location} />
        <NavGroup label="Tools" links={navLinks.slice(4)} location={location} />
      </nav>

      {/* Sign Out Button */}
      <div style={{ padding: "12px 12px 18px", borderTop: `1px solid ${C.sidebarLine}` }}>
        <button
          onClick={doLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "9px 14px",
            borderRadius: 9999,
            background: "#ffffff",
            border: `1px solid ${C.sidebarLine}`,
            color: C.sidebarMuted,
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            ...M,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.borderColor = "#fca5a5";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = C.sidebarLine;
            e.currentTarget.style.color = C.sidebarMuted;
          }}
        >
          <LogOut style={{ width: 14, height: 14 }} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #f0f7ff 0%, #e0f2fe 35%, #acd9fb 75%, #93c5fd 100%)",
      backgroundAttachment: "fixed",
      ...M
    }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: 240,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(172, 217, 251, 0.4)",
            boxShadow: "2px 0 14px rgba(37, 99, 235, 0.04)",
          }}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.4)",
                  backdropFilter: "blur(4px)",
                  zIndex: 50,
                }}
              />
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 250,
                  background: "rgba(255, 255, 255, 0.96)",
                  backdropFilter: "blur(20px)",
                  zIndex: 51,
                  display: "flex",
                  flexDirection: "column",
                  borderRight: "1px solid rgba(172, 217, 251, 0.4)",
                  boxShadow: "4px 0 24px rgba(15, 23, 42, 0.15)",
                }}
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Main Content Area */}
      <div style={{ marginLeft: isMobile ? 0 : 240, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Clean Frosted Top Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(172, 217, 251, 0.4)",
            height: 58,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.foreground,
                  cursor: "pointer",
                }}
              >
                <Menu size={18} />
              </button>
            )}
            <p style={{ fontSize: 13, color: C.muted, margin: 0, fontWeight: 600 }}>
              {new Date().toLocaleString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Notifications Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setBellOpen((o) => !o)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                <Bell style={{ width: 15, height: 15 }} />
                {announcements.length > 0 && (
                  <span style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: C.brand }} />
                )}
              </button>

              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    key="bell"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 46,
                      width: 290,
                      background: "#fff",
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: 14,
                      zIndex: 200,
                      boxShadow: "0 10px 30px rgba(15,23,42,0.1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.foreground }}>Campus Updates</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: C.brand, background: C.brandSoft, padding: "2px 7px", borderRadius: 9999 }}>
                        {announcements.length} active
                      </span>
                    </div>
                    {announcements.length === 0 ? (
                      <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "10px 0", margin: 0 }}>
                        No new updates right now.
                      </p>
                    ) : (
                      announcements.map((ann) => (
                        <div key={ann._id} style={{ padding: "8px 10px", borderRadius: 8, background: "#f8fafc", border: `1px solid ${C.border}`, marginBottom: 6 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: C.foreground, margin: "0 0 2px" }}>{ann.title}</p>
                          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{ann.message}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Pill */}
            <NavLink
              to="/app/profile"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: C.brandSoft,
                border: `1px solid ${C.brandBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: C.brand,
                textDecoration: "none",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </NavLink>
          </div>
        </header>

        {/* Announcement Alert Banner */}
        {activeAnnouncement && !bannerDismissed && (
          <div style={{ margin: "12px 24px 0", padding: "10px 14px", borderRadius: 10, background: C.brandSoft, border: `1px solid ${C.brandBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <p style={{ fontSize: 12.5, color: C.foreground, margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <strong style={{ color: C.brandDeep }}>{activeAnnouncement.title}:</strong> {activeAnnouncement.message}
            </p>
            <button onClick={() => setBannerDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        <main style={{ flex: 1, padding: isMobile ? "16px" : "24px 28px 40px", maxWidth: 1240, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <AnimatePresence>
            <motion.div key={location.pathname} variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.12, ease: "easeOut" }}>
              <Outlet context={{ openQuickAdd: () => setQuickAddOpen(true) }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          setQuickAddOpen(false);
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />
      <DemoNoticeModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
      <AdSenseInterstitialModal />
    </div>
  );
}

function NavGroup({ label, links, location }) {
  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", padding: "0 12px 5px", margin: 0 }}>
        {label}
      </p>
      {links.map((item) => (
        <SideNavItem key={item.to} item={item} />
      ))}
    </div>
  );
}

function SideNavItem({ item }) {
  const { icon: Icon, to, label, end } = item;
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 10,
        marginBottom: 2,
        fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? "#2563eb" : "#64748b",
        background: isActive ? "#eff6ff" : "transparent",
        border: `1px solid ${isActive ? "#dbeafe" : "transparent"}`,
        textDecoration: "none",
        transition: "all 0.12s ease",
        ...M,
      })}
    >
      {({ isActive }) => (
        <>
          <Icon style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? "#2563eb" : "#64748b" }} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
