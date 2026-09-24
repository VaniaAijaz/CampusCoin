import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, BarChart2, Target,
  Tag, Lightbulb, Settings, Shield, LogOut, Map, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/transactions", icon: ArrowLeftRight,  label: "Transactions" },
  { to: "/reports",      icon: BarChart2,       label: "Reports"      },
  { to: "/budget",       icon: Target,          label: "Budget Goals" },
  { to: "/categories",   icon: Tag,             label: "Categories"   },
  { to: "/insights",     icon: Lightbulb,       label: "AI Insights"  },
];

export default function Sidebar({ onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "#FFFFFF",
      borderRight: "1px solid var(--color-border)",
      display: "flex",
      flexDirection: "column",
    }}
    className="dark:bg-dark-card dark:border-dark-border"
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: 34, height: 34,
          background: "var(--color-brand)",
          borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>₵</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-dark)", lineHeight: 1.2 }}>
            Campus Coin
          </div>
          <div style={{ fontSize: 11, color: "var(--color-subtle)", fontWeight: 400 }}>
            Smart Spending
          </div>
        </div>
        {/* Mobile close */}
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", color: "var(--color-subtle)", padding: 4,
            display: "none",
          }}
          className="mobile-close-btn"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={18} strokeWidth={isActive => isActive ? 2 : 1.75} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}

        <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />

        <NavLink
          to="/sitemap"
          onClick={onClose}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Map size={18} />
          <span>Sitemap</span>
        </NavLink>

        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* User info + logout */}
      <div style={{
        padding: "12px",
        borderTop: "1px solid var(--color-border)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 10px",
          borderRadius: 10,
          cursor: "pointer",
          transition: "background 150ms",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--color-page)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          onClick={() => { navigate("/profile"); onClose?.(); }}
        >
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-dark)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || "Student"}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.academicYear || "Campus Coin"}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleLogout(); }}
            title="Logout"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-subtle)", padding: 4, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 150ms, background 150ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--color-danger)"; e.currentTarget.style.background = "var(--color-danger-bg)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--color-subtle)"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-close-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
