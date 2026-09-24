export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-page)",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        width: 44, height: 44,
        background: "var(--color-brand)",
        borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "pulse 1.5s ease-in-out infinite",
      }}>
        <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>₵</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--color-subtle)", fontWeight: 500 }}>
        Loading Campus Coin...
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
