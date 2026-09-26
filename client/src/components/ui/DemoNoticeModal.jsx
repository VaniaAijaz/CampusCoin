import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Sparkles, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Portal from "../../components/ui/Portal";

export default function DemoNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md p-6 sm:p-7 rounded-[32px]
                     bg-white/[0.04] backdrop-blur-[80px] backdrop-saturate-[180%]
                     border border-white/20 border-t-white/30 border-l-white/30
                     shadow-[0_24px_64px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)]
                     text-center overflow-hidden"
        >
          {/* Subtle Top Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-brand-primary/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Pod */}
          <div className="w-14 h-14 mx-auto mb-4 rounded-[20px] bg-white/10 border border-white/25 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
            <ShieldAlert className="w-7 h-7 text-amber-300" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Demo Mode</span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            Action Restricted
          </h3>

          {/* Exact Required Spec Prompt Message */}
          <p className="text-sm text-white/80 leading-relaxed font-medium mb-6">
            This is a demo environment. You can explore the UI freely, but data submission is disabled.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 min-h-[46px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Continue Exploring
            </button>
            <Link
              to="/register"
              onClick={onClose}
              className="w-full sm:flex-1 min-h-[46px] rounded-full bg-white text-slate-950 hover:bg-white/95 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-[0_8px_24px_rgba(255,255,255,0.2)] active:scale-95"
            >
              <span>Create Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
        </div>
      </AnimatePresence>
    </Portal>
  );
}
