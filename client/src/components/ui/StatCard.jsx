export default function StatCard({ label, value, sub, icon, trend, trendPositive, color = "var(--color-brand)" }) {
  return (
    <div className="cc-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-subtle)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </div>
        {icon && (
          <div className="icon-box" style={{ background: `${color}14`, color }}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="stat-value">{value}</div>
        {sub && (
          <div style={{ fontSize: 12, color: "var(--color-subtle)", marginTop: 4 }}>{sub}</div>
        )}
      </div>

      {trend !== undefined && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600,
          color: trendPositive ? "var(--color-success)" : "var(--color-danger)",
          background: trendPositive ? "var(--color-success-bg)" : "var(--color-danger-bg)",
          padding: "2px 8px",
          borderRadius: 6,
          alignSelf: "flex-start",
        }}>
          {trendPositive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}
