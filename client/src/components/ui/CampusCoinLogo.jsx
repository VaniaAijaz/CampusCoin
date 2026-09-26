import CampusCoinIcon from "./CampusCoinIcon";

/**
 * CampusCoinLogo — responsive brand mark
 * xs/sm  → icon only
 * sm+    → icon + wordmark
 * sizes: "sm" | "md" | "lg"
 */
const cfg = {
  sm: { iconSize: 28, text: "text-sm",   sub: false  },
  md: { iconSize: 36, text: "text-base", sub: true   },
  lg: { iconSize: 48, text: "text-xl",   sub: true   },
};

export default function CampusCoinLogo({ size = "md", className = "" }) {
  const { iconSize, text, sub } = cfg[size] || cfg.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon always visible */}
      <CampusCoinIcon size={iconSize} className="shrink-0" />

      {/* Wordmark: hidden on xs, shows from sm up */}
      <div className="hidden sm:flex flex-col leading-none">
        <span
          className={`${text} font-black text-white tracking-tight leading-none`}
          style={{ fontFamily: "'Cabinet Grotesk', sans-serif", letterSpacing: "-0.02em" }}
        >
          CampusCoin<span className="text-[#5170FF]">.</span>
        </span>
        {sub && (
          <span className="text-[9px] text-white/50 font-semibold tracking-widest uppercase mt-0.5">
            Student Finance
          </span>
        )}
      </div>
    </div>
  );
}
