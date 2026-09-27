import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  CheckCircle2,
  Sparkles,
  X,
  Shield,
  Zap,
  Check,
  Ban,
} from "lucide-react";
import Portal from "../ui/Portal";
import { useAuth } from "../../features/auth/AuthContext";
import api from "../../core/api";
import toast from "react-hot-toast";

export default function PremiumUpgradeModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isPremium = Boolean(user?.isPremium || user?.plan === "premium");

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/users/upgrade-premium");
      if (data.success) {
        updateUser(data.user);
        toast.success("Welcome to CampusCoin Premium! All ads are now removed.");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upgrade subscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/users/cancel-premium");
      if (data.success) {
        updateUser(data.user);
        toast.success("Downgraded to Free tier. Standard ads enabled.");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update subscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <AnimatePresence>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg p-6 sm:p-8 rounded-[32px]
                       bg-white/[0.04] backdrop-blur-[80px] backdrop-saturate-[180%]
                       border border-amber-400/30 border-t-amber-400/40
                       shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)]
                       space-y-6 overflow-hidden text-white"
          >
            {/* Golden Glow Gradient */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>CampusCoin Premium</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                      Pro Tier
                    </span>
                  </h3>
                  <p className="text-xs text-white/60">
                    Enjoy a completely ad-free student financial management experience
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pricing Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-white/5 to-white/5 border border-amber-400/30 flex items-center justify-between gap-4 relative z-10">
              <div>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                  Student Pricing
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-white">$2</span>
                  <span className="text-xs text-white/70 font-semibold">/ month</span>
                </div>
                <p className="text-[11px] text-white/60 font-medium">
                  Approximately <strong className="text-white">PKR 500</strong> per month
                </p>
              </div>

              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  isPremium
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                    : "bg-white/10 border-white/20 text-white/70"
                }`}>
                  {isPremium ? "Active Member" : "Free Tier"}
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-2.5 relative z-10">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider">
                What's Included:
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-white/90">
                  <Ban className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>100% Ad-Free UI:</strong> Completely hides all Google AdSense banners across every page.</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/90">
                  <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                  <span><strong>Faster Performance:</strong> Zero external advertisement network scripts loaded.</span>
                </div>
                <div className="flex items-center gap-2.5 text-white/90">
                  <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                  <span><strong>Priority AI Insights & Reports:</strong> Instant financial summaries and unlimited statements.</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 relative z-10">
              {isPremium ? (
                <button
                  type="button"
                  onClick={handleDowngrade}
                  disabled={loading}
                  className="w-full min-h-[46px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Downgrade to Free Tier (Enable Ads)"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>{loading ? "Activating..." : "Upgrade to Premium ($2 / PKR 500)"}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
}
