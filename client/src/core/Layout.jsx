import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Sparkles,
  BarChart3, Tag, User, Shield, LogOut, Plus, Coins, Calendar,
  Bell, ChevronRight,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Iridescence from "../components/ui/Iridescence";
import TransactionModal from "../features/transactions/TransactionModal";
import api from "./api";

const PAGE_VARIANTS = {
  initial:  { opacity: 0, y: 14 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// Glass utility
const glass = "bg-white/25 backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/30";

export default function Layout() {
  const { user, logout, isAdmin, isAuthenticated, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const navigate  = useNavigate();
  const location  = useLocation();

  const [quickAddOpen,       setQuickAddOpen]       = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/announcements")
      .then(({ data }) => {
        if (data.success && data.announcements?.length)
          setActiveAnnouncement(data.announcements[0]);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const navLinks = [
    { to: "/app",               label: "Dashboard",      icon: LayoutDashboard, end: true },
    { to: "/app/transactions",  label: "Transactions",   icon: ArrowLeftRight  },
    { to: "/app/budget",        label: "Budget",         icon: PieChart        },
    { to: "/app/insights",      label: "AI Insights",    icon: Sparkles,  badge: "AI"    },
    { to: "/app/reports",       label: "Reports",        icon: BarChart3       },
    { to: "/app/categories",    label: "Categories",     icon: Tag             },
    { to: "/app/profile",       label: "Profile",        icon: User            },
  ];
  if (isAdmin) navLinks.push({ to: "/app/admin", label: "Admin", icon: Shield, badge: "Admin" });

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-x-hidden">

      {/* Iridescence WebGL Background */}
      <div className="fixed inset-0 -z-20">
        <Iridescence
          color={[1, 1, 1]}
          speed={1.0}
          amplitude={0.1}
          mouseReact={false}
        />
      </div>
      {/* Minimal tint — let the iridescence show through */}
      <div className="fixed inset-0 bg-black/20 -z-10 pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-60 ${glass} shadow-[4px_0_24px_rgba(0,0,0,0.3)] z-40 p-4 justify-between`}>
        <div className="flex flex-col gap-1">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-4 mb-2">
            <div className="w-9 h-9 rounded-[14px] bg-white/20 border border-white/30 flex items-center justify-center shadow-inner shrink-0">
              <Coins className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight leading-none">Campus Coin</p>
              <p className="text-[9px] text-white/50 font-semibold tracking-widest uppercase mt-0.5">Student Finance</p>
            </div>
          </div>

          {/* User card */}
          {user && (
            <div className="mx-1 mb-3 px-3 py-2.5 rounded-[16px] bg-white/8 border border-white/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-xs font-black text-white shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-white/50 mt-0.5 truncate">{user.role === "admin" ? "Administrator" : user.academicYear || "Student"}</p>
              </div>
            </div>
          )}

          {/* Nav sections */}
          <div className="space-y-0.5">
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest px-3 py-1">Main</p>
            {navLinks.slice(0, 3).map((item) => <SideNavItem key={item.to} item={item} />)}
          </div>
          <div className="space-y-0.5 mt-3">
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest px-3 py-1">Tools</p>
            {navLinks.slice(3).map((item) => <SideNavItem key={item.to} item={item} />)}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-60 flex flex-col min-h-screen pb-20 md:pb-0">

        {/* Header */}
        <header className={`sticky top-0 z-30 ${glass} shadow-[0_1px_0_rgba(255,255,255,0.08)] px-4 sm:px-6 py-3 flex flex-col gap-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">
                {navLinks.find(n => location.pathname === n.to || (location.pathname.startsWith(n.to) && n.to !== "/app"))?.label || "Dashboard"}
              </span>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/70">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Add transaction button */}
              <button
                onClick={() => setQuickAddOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>

              {isAuthLoading || !user ? (
                <div className="w-8 h-8 rounded-full bg-white/15 animate-pulse" />
              ) : (
                <NavLink to="/app/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-xs font-black text-white border border-white/30 hover:scale-105 transition-transform shadow-lg">
                  {user?.name?.[0]?.toUpperCase()}
                </NavLink>
              )}
            </div>
          </div>

          {/* AI insight banner */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/10 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-semibold text-white/90 shrink-0">AI:</span>
            <span className="text-white/60 truncate">
              {activeAnnouncement?.message || "You're on track to save $120 this month. Keep it up!"}
            </span>
            <NavLink to="/app/insights" className="ml-auto shrink-0 px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors">
              View
            </NavLink>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${glass} border-t border-white/15 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]`}>
          <div className="flex justify-around items-center px-1 py-2">
            {navLinks.slice(0, 4).map((item) => <MobileNavItem key={item.to} item={item} />)}
            <button onClick={() => setQuickAddOpen(true)} className="flex flex-col items-center gap-1 p-2 text-white/50 hover:text-white cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[9px]">Add</span>
            </button>
          </div>
        </nav>

        {/* Page with AnimatePresence */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
            >
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
    </div>
  );
}

function SideNavItem({ item }) {
  const { icon: Icon, to, label, badge, end } = item;
  return (
    <NavLink to={to} end={end} className="relative block rounded-full">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="sidebarPill"
              className="absolute inset-0 rounded-full bg-white/20 border border-white/25"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <div className={`relative flex items-center justify-between px-3 py-2 rounded-full text-xs cursor-pointer transition-colors
            ${isActive ? "text-white font-bold" : "text-white/55 hover:text-white/90 hover:bg-white/8"}`}>
            <div className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </div>
            {badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/15 border border-white/20 font-bold">
                {badge}
              </span>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ item }) {
  const { icon: Icon, to, label, end } = item;
  return (
    <NavLink to={to} end={end} className="relative flex flex-col items-center gap-0.5 p-2 min-w-[3rem]">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="mobilePill"
              className="absolute inset-0 rounded-xl bg-white/15"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className={`relative w-5 h-5 z-10 transition-colors ${isActive ? "text-white" : "text-white/45"}`} />
          <span className={`relative text-[9px] z-10 font-semibold transition-colors ${isActive ? "text-white" : "text-white/45"}`}>
            {label.split(" ")[0]}
          </span>
        </>
      )}
    </NavLink>
  );
}
