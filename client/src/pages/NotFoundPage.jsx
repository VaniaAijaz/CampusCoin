import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-page)",
      padding: "24px",
      textAlign: "center",
      gap: 16,
    }}>
      <div style={{
        width: 72, height: 72,
        background: "var(--color-brand-light)",
        borderRadius: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: "var(--color-brand)" }}>₵</span>
      </div>
      <div>
        <div style={{ fontSize: 72, fontWeight: 800, color: "var(--color-brand)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>404</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-dark)", margin: "12px 0 8px" }}>Page Not Found</h1>
        <p style={{ fontSize: 14, color: "var(--color-subtle)", maxWidth: 320, margin: "0 auto" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={() => window.history.back()} className="cc-btn-secondary">
          <ArrowLeft size={15} /> Go Back
        </button>
        <Link to="/dashboard" className="cc-btn-primary">
          <Home size={15} /> Dashboard
        </Link>
      </div>
    </div>
  );
}
