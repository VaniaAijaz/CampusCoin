import { useState, useEffect } from "react";
import { X, Crown, Info, Sparkles, ExternalLink } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import AdSenseAd from "./AdSenseAd";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

/**
 * Global 3-Second Timed AdSense Interstitial Modal for Free Users.
 * Triggers an advertisement 3 seconds after the user arrives on the app.
 * Premium ($2/mo) users are 100% ad-free and never see this.
 */
export default function AdSenseInterstitialModal() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canClose, setCanClose] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // STRICT AD-FREE CHECK: Free users get ads after 3 seconds; Premium users ($2/mo) NEVER see any ads!
  const isPremium = Boolean(user?.isPremium || user?.plan === "premium");

  useEffect(() => {
    if (!isAuthenticated || isPremium) return;

    // Check session storage to avoid spamming the user on every rapid sub-route transition
    const alreadyShown = sessionStorage.getItem("campuscoin_timed_ad_shown");
    if (alreadyShown) return;

    // Trigger ad popup after exactly 3 seconds (3000ms)
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("campuscoin_timed_ad_shown", "true");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isPremium]);

  // Handle 3-second skip countdown when ad is open
  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanClose(true);
    }
  }, [isOpen, countdown]);

  if (!isOpen || isPremium) {
    return (
      <PremiumUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="relative w-full max-w-xl rounded-3xl bg-[#0a0f1d] border border-white/20 p-5 sm:p-6 text-white shadow-2xl overflow-hidden flex flex-col gap-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Advertisement
              </span>
              <span className="font-semibold text-white/80">Ads by Google</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUpgradeModalOpen(true)}
                className="text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Go Ad-Free ($2/mo)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  canClose
                    ? "bg-white/20 hover:bg-white/30 text-white border-white/30"
                    : "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                }`}
                disabled={!canClose}
              >
                <span>{canClose ? "Skip Ad" : `Skip in ${countdown}s`}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ad Unit Container */}
          <div className="w-full flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] rounded-2xl bg-black/40 border border-white/10 p-3 overflow-hidden">
            <AdSenseAd slot="dashboard" adFormat="auto" />
          </div>

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-white/50">
            <span>Free Tier Student Sponsorship</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setUpgradeModalOpen(true);
              }}
              className="text-sky-300 hover:text-sky-200 hover:underline text-left sm:text-right font-medium cursor-pointer"
            >
              Never see this again with Premium ($2/mo ≈ PKR 500) →
            </button>
          </div>
        </div>
      </div>

      <PremiumUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </>
  );
}
