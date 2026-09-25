import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

export default function BudgetProgressRing({
  categoryName = "General",
  spentAmount = 0,
  limitAmount = 100,
  icon = "tag",
  color = "#6366F1",
  onEdit,
}) {
  const { percentage, remaining, status, strokeColor, statusBadge } = useMemo(() => {
    const rawPct = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0;
    const roundedPct = Math.round(rawPct);
    const rem = limitAmount - spentAmount;

    let stat = "safe";
    let stroke = "#10B981"; // Emerald
    let badge = { text: "On Track", icon: CheckCircle2, color: "text-brand-mint bg-brand-mint/10 border-brand-mint/20" };

    if (rawPct >= 100) {
      stat = "danger";
      stroke = "#F43F5E"; // Rose
      badge = { text: "Cap Exceeded", icon: AlertTriangle, color: "text-brand-coral bg-brand-coral/10 border-brand-coral/20" };
    } else if (rawPct >= 75) {
      stat = "warning";
      stroke = "#F59E0B"; // Amber
      badge = { text: "Approaching Limit", icon: TrendingUp, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
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
  const size = 110;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Clamp progress to 100 for SVG stroke dashoffset
  const progressRatio = Math.min(100, Math.max(0, percentage)) / 100;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const StatusIcon = statusBadge.icon;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      {/* Background radial highlight */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: strokeColor }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md text-xs font-bold"
            style={{ backgroundColor: `${color}33`, border: `1px solid ${color}66` }}
          >
            ₵
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white group-hover:text-brand-primary/80 transition-colors">
              {categoryName}
            </h4>
            <p className="text-2xs text-zinc-400">
              Cap: <span className="text-zinc-200 font-medium">${limitAmount.toFixed(0)}</span>
            </p>
          </div>
        </div>

        {/* Gamified Status Badge */}
        <span
          className={`text-2xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusBadge.text}
        </span>
      </div>

      {/* Center Circular Progress Ring */}
      <div className="flex items-center justify-center my-2 relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10"
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
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight text-white leading-none">
            {percentage}%
          </span>
          <span className="text-3xs text-zinc-400 mt-1 uppercase font-medium">Spent</span>
        </div>
      </div>

      {/* Footer Metrics & Cap Status */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
        <div>
          <span className="text-zinc-400 text-2xs block">Used</span>
          <span className="font-semibold text-white">${spentAmount.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="text-zinc-400 text-2xs block">
            {remaining >= 0 ? "Left to Spend" : "Over Budget"}
          </span>
          <span
            className={`font-semibold ${
              remaining >= 0 ? "text-brand-mint" : "text-brand-coral"
            }`}
          >
            {remaining >= 0 ? `$${remaining.toFixed(2)}` : `-$${Math.abs(remaining).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Edit Budget Action Button */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-2xs font-medium border border-white/5 transition-all text-center cursor-pointer"
        >
          Adjust Monthly Cap
        </button>
      )}
    </div>
  );
}
