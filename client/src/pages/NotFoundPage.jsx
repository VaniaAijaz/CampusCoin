import { Link } from "react-router-dom";
import { Home, ArrowLeft, Coins } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Refraction Canvas */}
      <div 
        className="fixed inset-0 h-screen w-screen bg-cover bg-center -z-20 scale-100"
        style={{ backgroundImage: "url('/liquid_bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] -z-10" />

      <div className="w-full max-w-md p-8 sm:p-10 rounded-[32px] bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] text-center">
        <div className="w-16 h-16 rounded-[24px] bg-white/20 border border-white/40 flex items-center justify-center text-white mx-auto mb-6 shadow-inner">
          <Coins className="w-8 h-8 text-white drop-shadow-sm" />
        </div>

        <div className="text-6xl font-black text-white leading-none tracking-tight mb-3 drop-shadow-sm">
          404
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-xs text-white/70 max-w-xs mx-auto mb-8 leading-relaxed font-medium">
          The link you followed doesn't exist or has been relocated within Campus Coin.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button 
            type="button"
            onClick={() => window.history.back()} 
            className="flex-1 py-2.5 px-4 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link 
            to="/app" 
            className="flex-1 py-2.5 px-4 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
