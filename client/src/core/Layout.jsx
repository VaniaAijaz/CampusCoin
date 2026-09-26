import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Sparkles,
  BarChart3, Tag, User, Shield, LogOut, Plus, Coins, Calendar,
  Palette, Check,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Iridescence from "../components/ui/Iridescence";
import TransactionModal from "../features/transactions/TransactionModal";
import api from "./api";

// Apple visionOS Extreme Liquid Glass Standard Recipe
const glassRecipe =
  "bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function Layout() {
  const { user, logout, isAdmin, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const { color, themeId, selectTheme, themes } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/announcements")
      .then(({ data }) => {
        if (data.success && data.announcements?.length) {
          setActiveAnnouncement(data.announcements[0]);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const navLinks = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
    { to: "/app/budget", label: "Budget", icon: PieChart },
    { to: "/app/insights", label: "AI Insights", icon: Sparkles, badge: "AI" },
    { to: "/app/reports", label: "Reports", icon: BarChart3 },
    { to: "/app/categories", label: "Categories", icon: Tag },
    { to: "/app/profile", label: "Profile", icon: User },
  ];

  if (isAdmin) {
    navLinks.push({ to: "/app/admin", label: "Admin", icon: Shield, badge: "Admin" });
  }

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
            {navLinks.slice(0, 3).map((item) => (
              <SideNavItem key={item.to} item={item} />
            ))}
          </div>

          <div className="space-y-1 mt-4">
            <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest px-3 py-1 mb-1">
              Tools & Analytics
            </p>
            {navLinks.slice(3).map((item) => (
              <SideNavItem key={item.to} item={item} />
            ))}
          </div>
        </div>

        {/* Bottom Actions: Theme Switcher & Logout */}
        <div className="pt-4 border-t border-white/20 flex flex-col gap-2">
          {/* Theme Palette Quick Selector */}
          <div className="flex items-center justify-between px-3 py-1 text-xs text-white/70">
            <span className="text-[10px] uppercase font-bold tracking-wider">Aura Theme</span>
            <div className="flex gap-1.5 items-center">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => selectTheme(th.id)}
                  title={th.name}
                  className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                    themeId === th.id
                      ? "scale-125 border-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      : "border-white/40 opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `rgb(${Math.round(th.color[0] * 255)}, ${Math.round(th.color[1] * 255)}, ${Math.round(th.color[2] * 255)})`,
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => {
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
              {/* Quick Add Button */}
              <button
                onClick={() => setQuickAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-bold text-white transition-transform active:scale-95 cursor-pointer min-h-[44px] shadow-sm"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Add Entry</span>
              </button>

              {/* Theme Palette Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  title="Switch Fluid Theme"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 flex items-center justify-center text-white transition-colors cursor-pointer min-h-[44px]"
                >
                  <Palette className="w-4 h-4 text-white/90" />
                </button>

                {themeMenuOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-48 p-2 rounded-[24px] ${glassRecipe} z-50 flex flex-col gap-1`}
                  >
                    <p className="text-[10px] uppercase font-bold text-white/60 px-3 py-1">Theme Palette</p>
                    {themes.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          selectTheme(th.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          themeId === th.id ? "bg-white/25 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-white/40"
                            style={{
                              backgroundColor: `rgb(${Math.round(th.color[0] * 255)}, ${Math.round(th.color[1] * 255)}, ${Math.round(th.color[2] * 255)})`,
                            }}
                          />
                          <span>{th.name}</span>
                        </div>
                        {themeId === th.id && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Avatar Pill */}
              {isAuthLoading || !user ? (
                <div className="w-10 h-10 rounded-full bg-white/15 animate-pulse min-h-[44px]" />
              ) : (
                <NavLink
                  to="/app/profile"
                  className="flex items-center gap-2 p-1 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 transition-transform active:scale-95 text-xs font-medium text-white shadow-sm min-h-[44px]"
                >
                  <div className="w-8 h-8 rounded-full bg-white/25 text-white border border-white/40 flex items-center justify-center text-sm font-bold shadow-inner">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </NavLink>
              )}
            </div>
          </div>

          {/* Liquid Glass Header AI Banner */}
          <div className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-white/10 backdrop-blur-[30px] border border-white/25 shadow-sm text-xs text-white">
            <div className="flex items-center gap-2 truncate pr-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-bold text-white shrink-0">Insight:</span>
              <span className="text-white/85 truncate">
                {activeAnnouncement?.message || "You are on track to save $120 this month. Keep up the good work!"}
              </span>
            </div>
            <NavLink
              to="/app/insights"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 border border-white/30 rounded-full font-semibold text-white shrink-0 text-[11px] min-h-[28px] inline-flex items-center"
            >
              View
            </NavLink>
          </div>
        </header>

        {/* Mobile Sticky Liquid Glass Bottom Navigation Bar */}
        <nav
          className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${glassRecipe} rounded-t-[32px] border-b-0 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] pb-safe`}
        >
          <div className="flex justify-around items-center p-2">
            {navLinks.slice(0, 4).map((item) => (
              <MobileNavItem key={item.to} item={item} />
            ))}
            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-full text-white/80 hover:text-white cursor-pointer min-h-[44px] min-w-[44px]"
            >
              <div className="w-7 h-7 rounded-full bg-white/25 border border-white/40 flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-white font-semibold leading-none">Add</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Route Container with AnimatePresence Cross-Fades */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_TRANSITION}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
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
              className="absolute inset-0 rounded-full bg-white/25 border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.15)] z-0"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
              className="absolute inset-0 rounded-2xl bg-white/20 border border-white/30 z-0"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
