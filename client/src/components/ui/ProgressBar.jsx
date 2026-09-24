export default function ProgressBar({ value, max, color, showLabel = true, height = 6 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isOver = value > max && max > 0;

  const barColor = isOver
    ? "var(--color-danger)"
    : pct >= 80
    ? "var(--color-warning)"
    : color || "var(--color-brand)";

  return (
    <div>
      <div className="progress-track" style={{ height }}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 11, color: "var(--color-subtle)" }}>
            ${value.toFixed(2)} spent
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: isOver ? "var(--color-danger)" : pct >= 80 ? "var(--color-warning)" : "var(--color-subtle)",
          }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
