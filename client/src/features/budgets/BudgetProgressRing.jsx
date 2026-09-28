import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/currencyUtils";
import CategoryIcon from "../../components/ui/CategoryIcon";

export default function BudgetProgressRing({
  categoryName = "General",
  spentAmount = 0,
  limitAmount = 100,
  icon = "tag",
  color = "#2563eb",
  onEdit,
  onDelete,
}) {
  const { user } = useAuth();
  const cur = user?.currency || "USD";

  const { percentage, remaining, status, strokeColor, statusBadge } = useMemo(() => {
    const rawPct = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0;
    const roundedPct = Math.round(rawPct);
    const rem = limitAmount - spentAmount;

    let stat = "safe";
    let stroke = "#16a34a"; // Emerald
    let badge = { text: "On Track", icon: CheckCircle2, bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" };

    if (rawPct >= 100) {
      stat = "danger";
      stroke = "#dc2626"; // Red
      badge = { text: "Cap Exceeded", icon: AlertTriangle, bg: "#fee2e2", color: "#dc2626", border: "#fecdd3" };
    } else if (rawPct >= 75) {
      stat = "warning";
      stroke = "#f59e0b"; // Amber
      badge = { text: "Near Limit", icon: TrendingUp, bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
    }

    return {
      percentage: roundedPct,
      remaining: rem,
      status: stat,
      strokeColor: stroke,
      statusBadge: badge,
    };
  }, [spentAmount, limitAmount]);

  // SVG circle calculations
  const size = 120;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(100, Math.max(0, percentage)) / 100;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const StatusIcon = statusBadge.icon;

  return (
    <div className="dash-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "20px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: `${color}18`,
              border: `1.5px solid ${color}35`,
              color: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CategoryIcon categoryName={categoryName} className="w-5 h-5" />
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.015em" }}>
              {categoryName}
            </h4>
            <p style={{ fontSize: 11.5, color: "#64748b", margin: "2px 0 0", fontWeight: 500 }}>
              Cap: <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(limitAmount, cur)}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 9999,
            background: statusBadge.bg,
            color: statusBadge.color,
            border: `1px solid ${statusBadge.border}`,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <StatusIcon style={{ width: 12, height: 12 }} />
          {statusBadge.text}
        </span>
      </div>

      {/* Center Circular Progress Ring */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "14px 0", position: "relative" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.025em", color: "#0f172a", lineHeight: 1 }}>
            {percentage}%
          </span>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>
            Spent
          </span>
        </div>
      </div>

      {/* Footer Metrics & Cap Status */}
      <div style={{ marginTop: 6, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
        <div>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block" }}>Used</span>
          <span style={{ fontWeight: 800, color: "#0f172a" }}>{formatCurrency(spentAmount, cur)}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block" }}>
            {remaining >= 0 ? "Safe to Spend" : "Over Limit"}
          </span>
          <span style={{ fontWeight: 800, color: remaining >= 0 ? "#16a34a" : "#dc2626" }}>
            {remaining >= 0 ? formatCurrency(remaining, cur) : `-${formatCurrency(Math.abs(remaining), cur)}`}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: onDelete ? "1fr auto" : "1fr", gap: 8, marginTop: 14 }}>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="dash-btn-secondary"
            style={{ height: 36, fontSize: 12, borderRadius: 10, justifyContent: "center" }}
          >
            <Edit2 style={{ width: 13, height: 13 }} />
            <span>Adjust Monthly Cap</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="dash-btn-danger"
            style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }}
            title="Remove budget limit"
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    </div>
  );
}
