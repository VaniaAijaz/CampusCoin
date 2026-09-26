import { Coins } from "lucide-react";
import Iridescence from "./Iridescence";
import { useTheme } from "../../context/ThemeContext";

export default function LoadingScreen({ message = "Loading Campus Coin..." }) {
  let themeColor = [0.06, 0.23, 0.44];
  try {
    const { color } = useTheme();
    if (color) themeColor = color;
  } catch {
    // If mounted outside ThemeProvider fallback to default
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Iridescence Background */}
      <div className="absolute inset-0 -z-20">
        <Iridescence color={themeColor} speed={1.0} amplitude={0.12} mouseReact={false} />
      </div>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] -z-10" />

      {/* Floating Liquid Glass Pod */}
      <div className="flex flex-col items-center gap-6 px-10 py-8 rounded-[32px] bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in-95 duration-500">
        {/* Sleek Thin Spinner with Campus Coin Centerpiece */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg
            className="w-16 h-16 animate-spin text-white"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background track circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="2.5"
            />
            {/* Spinning arc */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="url(#campusCoinSpinnerGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="120"
              strokeDashoffset="80"
            />
            <defs>
              <linearGradient id="campusCoinSpinnerGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" />
                <stop offset="0.5" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="rgba(255,255,255,0.2)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Brand Coin Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Coins className="w-6 h-6 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Campus Coin Typography */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h2 className="text-white font-extrabold text-base tracking-tight drop-shadow-sm">
            Campus Coin
          </h2>
          <p className="text-xs text-white/70 font-medium">
            {message}
          </p>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-sky-300 mt-1">
            Smart Spending, Student Style
          </span>
        </div>
      </div>
    </div>
  );
}
