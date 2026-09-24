import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-page)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      {/* Background subtle grid pattern */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(circle, var(--color-brand-soft) 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        opacity: 0.3,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <Link to="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          justifyContent: "center", marginBottom: 32, textDecoration: "none",
        }}>
          <div style={{
            width: 40, height: 40,
            background: "var(--color-brand)",
            borderRadius: 11,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>₵</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-dark)", lineHeight: 1.2 }}>
              Campus Coin
            </div>
            <div style={{ fontSize: 12, color: "var(--color-subtle)" }}>
              Smart Spending, Student Style
            </div>
          </div>
        </Link>

        <Outlet />
      </div>
    </div>
  );
}
