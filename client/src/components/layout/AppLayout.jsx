import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-page)" }}>
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div
        className="sidebar-wrap"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "var(--spacing-sidebar)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
        }}
        data-mobile-open={sidebarOpen}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 19,
            background: "rgba(41,41,46,0.3)", backdropFilter: "blur(2px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main area */}
      <div
        style={{
          flex: 1,
          marginLeft: "var(--spacing-sidebar)",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
        className="main-area"
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          style={{
            flex: 1,
            paddingTop: "var(--spacing-header)",
            paddingBottom: 72,
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      <style>{`
        @media (max-width: 768px) {
          .sidebar-wrap {
            transform: translateX(-100%);
            transition: transform 250ms ease;
            z-index: 30 !important;
          }
          .sidebar-wrap[data-mobile-open="true"] {
            transform: translateX(0);
          }
          .main-area {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
