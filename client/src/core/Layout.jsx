import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Sparkles,
  BarChart3,
  Tag,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Plus,
  Bell,
  Coins,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import TransactionModal from "../features/transactions/TransactionModal";
import api from "./api";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout() {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  // Fetch announcements for header ticker
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await api.get("/announcements");
        if (data.success && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
          setActiveAnnouncement(data.announcements[0]);
        }
      } catch {
        // Silent fail
      }
    };
    fetchAnnouncements();
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
    { to: "/app/budget", label: "Budget Rings", icon: PieChart },
    { to: "/app/insights", label: "AI Insights", icon: Sparkles, badge: "AI" },
    { to: "/app/reports", label: "Analytics & Reports", icon: BarChart3 },
    { to: "/app/categories", label: "Categories", icon: Tag },
    { to: "/app/profile", label: "Student Profile", icon: User },
  ];

  if (isAdmin) {
    navLinks.push({ to: "/app/admin", label: "Admin Portal", icon: Shield, badge: "Admin" });
  }

  const handleLogout = () => {
    logout();
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Unified Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-[#0E1322] border-r border-slate-800 shadow-xl z-40 p-5 justify-between">
        <div>
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xl">
              <Coins className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1 leading-tight">
                Campus Coin
              </h1>
              <p className="text-3xs text-slate-400 font-semibold tracking-wide uppercase">
                Student Finance
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-3xs text-slate-400 font-bold uppercase tracking-wider mb-2 mt-4 px-2">Menu</div>
            {navLinks.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
            
            <div className="text-3xs text-slate-400 font-bold uppercase tracking-wider mb-2 mt-6 px-2">Support</div>
            {navLinks.slice(3).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-3xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout at Sidebar Bottom */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer font-semibold text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Top Floating Header */}
        <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white tracking-tight">Overview</span>
              
              {/* Date Dropdown */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-200">October 2026</span>
              </div>
            </div>

            {/* Right Header Quick Actions */}
            {authLoading || !user ? (
              <div className="flex items-center gap-3 animate-pulse">
                {/* Pulsing translucent pill for the greeting */}
                <div className="hidden sm:flex flex-col items-end gap-1.5 mr-2">
                  <div className="h-3 w-28 bg-slate-800 rounded-full" />
                  <div className="h-2 w-16 bg-slate-800/80 rounded-full" />
                </div>
                {/* Pulsing circle for the user avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right mr-2">
                  <p className="text-xs font-bold text-white leading-tight">Welcome back,</p>
                  <p className="text-3xs text-slate-400">{user?.name || "Student"}</p>
                </div>

                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-xs font-medium text-white shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-sm font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </NavLink>
              </div>
            )}
          </div>
          
          {/* AI Banner Full Width Below Header */}
          <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-[#111726] border border-slate-800 shadow-sm text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white">AI Insight:</span>
              <span className="text-slate-300">You are on track to save $120 this month. Keep up the good work!</span>
            </div>
            <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full transition-colors font-semibold text-slate-200">
              View
            </button>
          </div>
        </header>

        {/* Mobile iOS Style Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1322]/95 backdrop-blur-md border-t border-slate-800 pb-safe">
          <div className="flex justify-around items-center p-2">
            {navLinks.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      isActive ? "text-white font-bold" : "text-white/50"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{item.label.split(" ")[0]}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-white/50 hover:text-white"
            >
              <Plus className="w-5 h-5 bg-white/20 rounded-full" />
              <span className="text-[10px]">Add</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Route Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
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
          // Trigger custom event so active pages refresh seamlessly
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />
    </div>
  );
}
