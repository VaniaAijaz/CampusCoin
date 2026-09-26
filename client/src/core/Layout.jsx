import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Sparkles,
  BarChart3, Tag, User, Shield, LogOut, Plus, Coins, Calendar,
  Palette, Check, BookOpen, Sun, Moon, Bell, X, AlertCircle, Repeat
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Iridescence from "../components/ui/Iridescence";
import TransactionModal from "../features/transactions/TransactionModal";
import DemoNoticeModal from "../components/ui/DemoNoticeModal";
import api from "./api";

// Video-Accurate Physical Spatial Glass Standard Recipe
const glassRecipe =
  "base-glass bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] transform-gpu backface-hidden";

export const SPRING_CONFIG = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
  bounce: 0,
};

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const PAGE_TRANSITION = {
  duration: 0.2,
  ease: "easeOut",
};

export default function Layout() {
  const { user, logout, isAdmin, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const { color, themeId, selectTheme, themes, mode, toggleMode, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Global listener for intercepted Demo Mode mutation attempts
  useEffect(() => {
    const handleDemoBlocked = () => {
      setDemoModalOpen(true);
    };
    window.addEventListener("campuscoin:demoBlocked", handleDemoBlocked);
    return () => window.removeEventListener("campuscoin:demoBlocked", handleDemoBlocked);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch active announcements for Student Dashboard Notification Bell & Top Banner
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/announcements")
      .then(({ data }) => {
        if (data.success && data.announcements?.length) {
          setAnnouncements(data.announcements);
          setActiveAnnouncement(data.announcements[0]);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Real Average Time Tracking: Lightweight Activity-Based Session Heartbeat (60 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    let wasActive = false;
    const registerEngagement = () => {
      wasActive = true;
    };

    window.addEventListener("mousemove", registerEngagement, { passive: true });
    window.addEventListener("scroll", registerEngagement, { passive: true });
    window.addEventListener("keydown", registerEngagement, { passive: true });
    window.addEventListener("touchstart", registerEngagement, { passive: true });

    // Initial mount heartbeat
    api.post("/users/heartbeat").catch(() => {});

    // Every 60 seconds ping heartbeat ONLY if user engaged
    const heartbeatTimer = setInterval(() => {
      if (wasActive) {
        api.post("/users/heartbeat").catch(() => {});
        wasActive = false;
      }
    }, 60000);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener("mousemove", registerEngagement);
      window.removeEventListener("scroll", registerEngagement);
      window.removeEventListener("keydown", registerEngagement);
      window.removeEventListener("touchstart", registerEngagement);
    };
  }, [isAuthenticated]);

  const navLinks = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
    { to: "/app/khata", label: "Khata (Ledger)", icon: BookOpen },
    { to: "/app/budget", label: "Budget", icon: PieChart },
    { to: "/app/subscriptions", label: "Subscriptions", icon: Repeat },
    { to: "/app/reports", label: "Reports", icon: BarChart3 },
    { to: "/app/categories", label: "Categories", icon: Tag },
    { to: "/app/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-x-hidden selection:bg-white/30 selection:text-white">
      {/* Dynamic Backgrounds — Iridescence WebGL Canvas */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        <Iridescence
          color={color}
          speed={0.8}
          amplitude={0.12}
          mouseReact={!isMobile}
        />
      </div>
      {/* Subtle Luminous Tint to enhance contrast */}
      <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] -z-10 pointer-events-none" />

      {/* Desktop Left-Aligned Liquid Glass Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 ${glassRecipe} z-40 p-5 justify-between rounded-r-[32px] border-l-0`}
      >
        <div className="flex flex-col gap-1">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-10 h-10 rounded-[18px] bg-white/20 border border-white/40 flex items-center justify-center shadow-inner shrink-0">
              <Coins className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div>
              <p className="text-base font-black text-white tracking-tight leading-none">Campus Coin</p>
              <p className="text-[10px] text-white/60 font-semibold tracking-widest uppercase mt-1">Smart Spending</p>
            </div>
          </div>

          {/* User Status Card */}
          {user && (
            <div className="mx-1 mb-4 p-3 rounded-[20px] bg-white/10 border border-white/20 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-white/25 border border-white/30 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-inner">
                {user.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-white/60 truncate mt-0.5 font-medium">
                  {user.role === "admin" ? "Platform Admin" : user.academicYear || "Student"}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <div className="space-y-1">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest px-3 py-1 mb-1">
              Menu
            </p>
            {navLinks.slice(0, 4).map((item) => (
              <SideNavItem key={item.to} item={item} />
            ))}
          </div>

          <div className="space-y-1 mt-4">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest px-3 py-1 mb-1">
              Tools & Analytics
            </p>
            {navLinks.slice(4).map((item) => (
              <SideNavItem key={item.to} item={item} />
            ))}
          </div>
        </div>

        {/* Bottom Actions: Theme Switcher & Logout */}
        <div className="pt-4 border-t border-white/20 flex flex-col gap-2">          <button
            onClick={async () => {
              try { await api.post("/users/logout-session"); } catch (_) {}
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/15 border border-white/20 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-24 md:pb-0">
        {/* Top Liquid Glass Header Nav */}
        <header
          className={`sticky top-0 z-30 ${glassRecipe} rounded-b-[28px] md:rounded-none border-t-0 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-2.5 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-white tracking-tight">
                {navLinks.find((n) => location.pathname === n.to || (location.pathname.startsWith(n.to) && n.to !== "/app"))?.label || "Overview"}
              </span>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/25 text-xs text-white/80 min-h-[36px]">
                <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
                <span className="font-semibold">{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Frosted Glass Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBellOpen(!bellOpen)}
                  title="Campus Announcements"
                  className="relative w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 flex items-center justify-center text-white transition-colors cursor-pointer min-h-[44px]"
                >
                  <Bell className="w-4 h-4 text-white/90" />
                  {announcements.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand-primary)]" />
                  )}
                </button>

                {bellOpen && (
                  <div
                    className="floating-glass absolute right-0 mt-2 w-80 max-w-[90vw] p-3.5 rounded-[24px] z-50 flex flex-col gap-2.5 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/20 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                        <Bell className="w-3.5 h-3.5 text-brand-primary" /> Campus Bulletins
                      </span>
                      <span className="text-[10px] text-white/60 font-semibold">{announcements.length} active</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-center py-4 text-white/60">No active campus announcements.</p>
                      ) : (
                        announcements.map((ann) => (
                          <div
                            key={ann._id}
                            className="p-3 rounded-2xl bg-white/10 border border-white/20 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white truncate">{ann.title}</span>
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 ${
                                ann.priority === 'urgent' ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' :
                                ann.priority === 'high' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' :
                                'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                              }`}>
                                {ann.priority || 'info'}
                              </span>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed">{ann.message}</p>
                            <p className="text-[9px] text-white/50">{new Date(ann.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Pill */}
              {isAuthLoading || !user ? (
                <div className="w-10 h-10 rounded-full bg-white/15 animate-pulse min-h-[44px]" />
              ) : (
                <div className="flex items-center gap-2">
                  <NavLink
                    to="/app/profile"
                    className="flex items-center gap-2 p-1 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 transition-transform active:scale-95 text-xs font-medium text-white shadow-sm min-h-[44px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/25 text-white border border-white/40 flex items-center justify-center text-sm font-bold shadow-inner">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  </NavLink>

                  {/* Highly Visible Mobile Log Out Button */}
                  <button
                    onClick={async () => {
                      try { await api.post("/users/logout-session"); } catch (_) {}
                      logout();
                      navigate("/login");
                    }}
                    title="Log Out"
                    className="md:hidden flex items-center justify-center px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer min-h-[38px] gap-1.5 shadow-sm active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Frosted Glass Top Announcement Banner (Student Dashboard Notification) */}
        {activeAnnouncement && !bannerDismissed && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-3 p-3 rounded-2xl bg-white/10 backdrop-blur-[80px] border border-white/25 flex items-center justify-between gap-3 shadow-lg transform-gpu">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                activeAnnouncement.priority === 'urgent' ? 'bg-rose-400 animate-ping' :
                activeAnnouncement.priority === 'high' ? 'bg-amber-400 animate-pulse' :
                'bg-brand-primary animate-pulse'
              }`} />
              <span className="text-[10px] font-black shrink-0 uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white">
                {activeAnnouncement.priority || "Announcement"}
              </span>
              <p className="text-xs text-white truncate font-medium">
                <span className="font-bold mr-1.5 text-white">{activeAnnouncement.title}:</span>
                <span className="text-white/80">{activeAnnouncement.message}</span>
              </p>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mobile Sticky Liquid Glass Bottom Navigation Bar */}
        <nav
          className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${glassRecipe} rounded-t-[32px] border-b-0 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] pb-safe`}
        >
          <div className="flex justify-around items-center p-2">
            {navLinks.slice(0, 4).map((item) => (
              <MobileNavItem key={item.to} item={item} />
            ))}
          </div>
        </nav>

        {/* Dynamic Route Container with AnimatePresence mode="wait" (Zero Flashing) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={PAGE_TRANSITION}
              className="w-full transform-gpu backface-hidden"
              style={{ willChange: "transform, opacity" }}
            >
              <Outlet context={{ openQuickAdd: () => setQuickAddOpen(true) }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          setQuickAddOpen(false);
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />

      {/* Interactive Demo Mode Mutation Interception Modal */}
      <DemoNoticeModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />
    </div>
  );
}

/**
 * Sliding "Magic Pill" Navigation for Desktop Sidebar
 * Uses motion.div layoutId="activeTab" with spring physics: stiffness: 400, damping: 30
 */
function SideNavItem({ item }) {
  const { icon: Icon, to, label, badge, end } = item;

  return (
    <NavLink to={to} end={end} className="relative block rounded-full min-h-[44px]">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-full bg-white/25 border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.15)] z-0 transform-gpu backface-hidden"
              transition={SPRING_CONFIG}
              style={{ willChange: "transform, opacity" }}
            />
          )}
          <div
            className={`relative z-10 flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium cursor-pointer transition-colors min-h-[44px] ${
              isActive ? "text-white font-bold" : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 shrink-0 text-white" />
              <span>{label}</span>
            </div>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 font-bold">
                {badge}
              </span>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

/**
 * Sliding "Magic Pill" Navigation for Mobile Bottom Navigation Bar
 */
function MobileNavItem({ item }) {
  const { icon: Icon, to, label, end } = item;

  return (
    <NavLink to={to} end={end} className="relative flex flex-col items-center justify-center p-2 rounded-2xl min-h-[44px] min-w-[48px]">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="activeMobileTab"
              className="absolute inset-0 rounded-2xl bg-white/20 border border-white/30 z-0 transform-gpu backface-hidden"
              transition={SPRING_CONFIG}
              style={{ willChange: "transform, opacity" }}
            />
          )}
          <Icon className={`relative z-10 w-5 h-5 transition-colors ${isActive ? "text-white" : "text-white/60"}`} />
          <span className={`relative z-10 text-[10px] mt-0.5 leading-none font-semibold transition-colors ${isActive ? "text-white font-bold" : "text-white/60"}`}>
            {label.split(" ")[0]}
          </span>
        </>
      )}
    </NavLink>
  );
}
