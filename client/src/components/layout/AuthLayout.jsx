import { Outlet, Link } from "react-router-dom";
import { Coins } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-obsidian via-brand-dark to-black text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-brand-primary text-brand-dark/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-brand-ai/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <Link
          to="/"
          className="flex items-center justify-center gap-3 mb-8 no-underline group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary to-brand-ai flex items-center justify-center text-white shadow-xl shadow-brand-primary/30 group-hover:scale-105 transition-transform">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight leading-tight">
              Campus Coin
            </div>
            <div className="text-2xs text-brand-primary/80 font-semibold tracking-wide uppercase">
              Smart Spending, Student Style
            </div>
          </div>
        </Link>

        {/* Content Outlet */}
        <Outlet />
      </div>
    </div>
  );
}
