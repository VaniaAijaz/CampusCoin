import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, Sun, Moon, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

const PAGE_TITLES = {
  "/dashboard":    "Dashboard",
  "/transactions": "Transactions",
  "/reports":      "Reports",
  "/budget":       "Budget Goals",
  "/categories":   "Categories",
  "/insights":     "AI Insights",
  "/profile":      "Settings",
  "/admin":        "Admin Panel",
  "/sitemap":      "Sitemap",
};

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || "Campus Coin";

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  return (
    <header style={{
      position: "fixed",
      top: 0,
      right: 0,
      left: "var(--spacing-sidebar)",
      height: "var(--spacing-header)",
      background: "#FFFFFF",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      zIndex: 10,
    }}
    className="dark-header"
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        style={{
          display: "none",
          background: "none", border: "none",
          cursor: "pointer", color: "var(--color-muted)",
          padding: 4, borderRadius: 6,
        }}
        className="mobile-menu-btn"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-dark)", margin: 0 }}>
          {pageTitle}
        </h1>
      </div>

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            width: 38, height: 38,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 9, border: "1px solid var(--color-border)",
            background: "transparent", cursor: "pointer",
            color: "var(--color-muted)",
            transition: "background 150ms, color 150ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-page)"; e.currentTarget.style.color = "var(--color-dark)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-muted)"; }}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          className="notif-btn"
          title="Notifications"
          onClick={() => toast("No new notifications.", { icon: "🔔" })}
        >
          <Bell size={17} />
        </button>

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            className="avatar"
            style={{ width: 36, height: 36, fontSize: 13 }}
            title="Profile"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {profileOpen && (
            <div className="cc-dropdown" style={{ right: 0, top: "calc(100% + 8px)", minWidth: 200 }}>
              <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-dark)" }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-subtle)", marginTop: 1 }}>{user?.email}</div>
              </div>
              <div style={{ padding: "4px 0" }}>
                <button className="dropdown-item" onClick={() => { navigate("/profile"); setProfileOpen(false); }}>
                  <Settings size={15} /> Settings
                </button>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          header.dark-header { left: 0 !important; }
        }
        .dark .dark-header {
          background: var(--color-dark-card) !important;
          border-color: var(--color-dark-border) !important;
        }
      `}</style>
    </header>
  );
}
