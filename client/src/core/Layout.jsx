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
  Plus,
  Coins,
  Calendar,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import TransactionModal from "../features/transactions/TransactionModal";
import api from "./api";

export default function Layout() {
  const { user, logout, isAdmin, isLoading: authLoading, loading } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : loading;
  const navigate = useNavigate();
  const location = useLocation();

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
    navigate("/login");
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-x-hidden selection:bg-white/30 selection:text-white">
      {/* Global High-Resolution Liquid Glass Background Canvas */}
      <div 
        className="fixed inset-0 h-screen w-screen bg-cover bg-center -z-20 pointer-events-none scale-100"
        style={{ backgroundImage: "url('/liquid_bg.jpg')" }}
      />
      {/* Soft Vignette Overlay to maintain contrast */}
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[1px] -z-10 pointer-events-none" />

      {/* Unified Liquid Glass Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border-r border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] z-40 p-5 justify-between">
        <div>
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-[16px] bg-white/20 backdrop-blur-[20px] border border-white/40 flex items-center justify-center text-white font-black text-xl shadow-inner">
              <Coins className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1 leading-tight">
                Campus Coin
              </h1>
              <p className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                Student Finance
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2 mt-4 px-3">
              Menu
            </div>
            {navLinks.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-white/25 text-white border border-white/40 shadow-sm font-bold backdrop-blur-[20px]"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-white" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
            
            <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-2 mt-6 px-3">
              Tools & Support
            </div>
            {navLinks.slice(3).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-white/25 text-white border border-white/40 shadow-sm font-bold backdrop-blur-[20px]"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-white" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout at Sidebar Bottom */}
        <div className="pt-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer font-semibold text-xs shadow-sm"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Top Floating Liquid Glass Header */}
        <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border-b border-white/20 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-white tracking-tight">Overview</span>
              
              {/* Date Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/30 text-xs text-white">
                <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
                <span className="font-semibold text-white">October 2026</span>
              </div>
            </div>

            {/* Right Header Quick Actions */}
            {isAuthLoading || !user ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="hidden sm:flex flex-col items-end gap-1.5 mr-2">
                  <div className="h-3 w-28 bg-white/20 rounded-full" />
                  <div className="h-2 w-16 bg-white/15 rounded-full" />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right mr-2">
                  <p className="text-xs font-bold text-white leading-tight">Welcome back,</p>
                  <p className="text-[10px] text-white/70">{user?.name || "Student"}</p>
                </div>

                <NavLink
                  to="/app/profile"
                  className="flex items-center gap-2 p-1 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 transition-colors text-xs font-medium text-white shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white border border-white/40 flex items-center justify-center text-sm font-bold shadow-inner">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </NavLink>
              </div>
            )}
          </div>
          
          {/* AI Banner Full Width Below Header */}
          <div className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-white/10 backdrop-blur-[30px] border border-white/30 shadow-sm text-xs text-white">
            <div className="flex items-center gap-2 truncate pr-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-bold text-white shrink-0">AI Insight:</span>
              <span className="text-white/90 truncate">
                {activeAnnouncement?.message || "You are on track to save $120 this month. Keep up the good work!"}
              </span>
            </div>
            <NavLink
              to="/app/insights"
              className="px-3 py-1 bg-white/20 hover:bg-white/30 border border-white/30 rounded-full transition-colors font-semibold text-white shrink-0 text-[11px]"
            >
              View
            </NavLink>
          </div>
        </header>

        {/* Mobile iOS Style Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/15 backdrop-blur-[40px] backdrop-saturate-[150%] border-t border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] pb-safe">
          <div className="flex justify-around items-center p-2">
            {navLinks.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app"}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 p-2 rounded-full transition-colors ${
                      isActive ? "text-white font-bold bg-white/20" : "text-white/60 hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-[10px] text-white">{item.label.split(" ")[0]}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setQuickAddOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-full text-white/80 hover:text-white cursor-pointer"
            >
              <Plus className="w-5 h-5 bg-white/25 rounded-full p-0.5 border border-white/40" />
              <span className="text-[10px] text-white">Add</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Route Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ openQuickAdd: () => setQuickAddOpen(true) }} />
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"));
        }}
      />
    </div>
  );
}
