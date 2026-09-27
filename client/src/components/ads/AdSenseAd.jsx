import { useState, useEffect, useRef } from "react";
import { Info, Crown, X, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

/**
 * Singleton Script Loader for Google AdSense SDK.
 * Ensures the official adsbygoogle.js script is loaded exactly once in document.head.
 */
let adSenseScriptPromise = null;

function loadAdSenseScriptOnce(publisherId) {
  if (typeof window === "undefined" || !publisherId) {
    return Promise.reject(new Error("Cannot load AdSense script without window or publisherId."));
  }

  if (window.adsbygoogle && window.adsbygoogle.loaded) {
    return Promise.resolve();
  }

  if (adSenseScriptPromise) {
    return adSenseScriptPromise;
  }

  adSenseScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-adsense-sdk");
    if (existingScript) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-adsense-sdk";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      console.log(`[AdSense Diagnostics] Google AdSense SDK loaded for ${publisherId}`);
      resolve();
    };

    script.onerror = (err) => {
      console.warn("[AdSense Diagnostics] AdSense script blocked or offline.", err);
      reject(err);
    };

    document.head.appendChild(script);
  });

  return adSenseScriptPromise;
}

/**
 * Resolves ad slot ID based on prop or environment variables.
 */
function resolveSlotId(slot, explicitSlotId) {
  if (explicitSlotId) return String(explicitSlotId);

  const env = import.meta.env;
  switch (slot) {
    case "dashboard":
      return env.VITE_ADSENSE_SLOT_DASHBOARD || "1029384756";
    case "transactions":
      return env.VITE_ADSENSE_SLOT_TRANSACTIONS || "2039485761";
    case "reports":
      return env.VITE_ADSENSE_SLOT_REPORTS || "3049586712";
    case "horizontal":
      return env.VITE_ADSENSE_SLOT_DASHBOARD || "1029384756";
    case "rectangle":
    case "box":
      return env.VITE_ADSENSE_SLOT_TRANSACTIONS || "2039485761";
    default:
      return /^\d+$/.test(slot) ? slot : (env.VITE_ADSENSE_SLOT_DASHBOARD || "1029384756");
  }
}

/**
 * Reusable Production-Ready Google AdSense Component.
 * Dynamically loads and presents the ad after 3 seconds for Free users.
 * Premium users ($2/month) remain 100% ad-free.
 */
export default function AdSenseAd({
  slot = "dashboard",
  slotId: explicitSlotId,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  delayMs = 3000,
}) {
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [adError, setAdError] = useState(null);
  const [isReadyToShow, setIsReadyToShow] = useState(false);

  const adRef = useRef(null);
  const adPushedRef = useRef(false);

  // 1. STRICT AD-FREE CHECK: Free users see real ads; Premium users ($2/month ≈ PKR 500) see NO ads anywhere!
  const isPremium = Boolean(user?.isPremium || user?.plan === "premium");
  if (isPremium || isDismissed) {
    return null;
  }

  // 2. Read Configuration from Environment Variables
  const env = import.meta.env;
  const rawKey =
    env.VITE_ADS_API_KEY ||
    env.VITE_ADSENSE_CLIENT_ID ||
    env.VITE_ADS_CLIENT_ID ||
    env.VITE_ADSENSE_PUBLISHER_ID ||
    "ca-pub-1234567890123456";

  // Auto-format publisher ID (ensure ca-pub- prefix if user pastes plain number or pub-)
  const formatPublisherId = (key) => {
    if (!key) return "ca-pub-1234567890123456";
    const cleaned = String(key).trim();
    if (cleaned.startsWith("ca-pub-")) return cleaned;
    if (cleaned.startsWith("pub-")) return `ca-${cleaned}`;
    if (/^\d+$/.test(cleaned)) return `ca-pub-${cleaned}`;
    return cleaned;
  };

  const publisherId = formatPublisherId(rawKey);
  const slotId = resolveSlotId(slot, explicitSlotId);
  const isTestMode = env.VITE_ADSENSE_TEST_MODE === "on";

  // 3. 3-Second Timed Activation & Safe Ad Push
  useEffect(() => {
    let isMounted = true;

    // Show ad after 3 seconds (3000ms)
    const showTimer = setTimeout(() => {
      if (!isMounted) return;
      setIsReadyToShow(true);

      loadAdSenseScriptOnce(publisherId)
        .then(() => {
          if (!isMounted) return;

          requestAnimationFrame(() => {
            if (adRef.current && !adPushedRef.current) {
              try {
                const status = adRef.current.getAttribute("data-adsbygoogle-status");
                if (!status) {
                  (window.adsbygoogle = window.adsbygoogle || []).push({});
                  adPushedRef.current = true;
                  console.log(`[AdSense Diagnostics] Pushed ad unit (Slot: ${slotId}, Publisher: ${publisherId}) after ${delayMs}ms delay.`);
                }
              } catch (err) {
                console.warn(`[AdSense Diagnostics] Notice on push for slot ${slotId}:`, err?.message || err);
              }
            }
          });
        })
        .catch((err) => {
          if (isMounted) {
            setAdError("AdSense SDK unavailable (AdBlocker or network offline).");
          }
        });
    }, delayMs);

    return () => {
      isMounted = false;
      clearTimeout(showTimer);
    };
  }, [publisherId, slotId, delayMs]);

  if (!isReadyToShow) {
    return null;
  }

  return (
    <>
      <div
        className={`relative w-full rounded-2xl bg-[#0a0f1d]/90 backdrop-blur-xl border border-white/10 shadow-lg text-white transition-all overflow-hidden p-3.5 sm:p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${className}`}
      >
        {/* Subtle Advertisement Header Label & Attribution */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-white/10 text-[11px] text-white/50 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Advertisement
            </span>
            <span
              className="hover:underline cursor-pointer flex items-center gap-1 text-[11px] text-white/60 hover:text-white/90 transition-colors"
              onClick={() => setInfoOpen(!infoOpen)}
              title="About Google AdSense on CampusCoin"
            >
              <span>Ads by Google</span>
              <Info className="w-3 h-3 text-white/40" />
            </span>
            {isTestMode && (
              <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono">
                Slot: {slotId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1.5 hover:underline cursor-pointer text-xs transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Hide Ads with Premium ($2/mo)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AdSense Info Dropdown */}
        {infoOpen && (
          <div className="mb-3 p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white/80 space-y-1 animate-in fade-in slide-in-from-top-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Google AdSense Network Integration
            </p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              This official Google AdSense unit supports CampusCoin’s free tier for students. You can eliminate all advertisements across the platform at any time by upgrading to{" "}
              <strong className="text-amber-300">CampusCoin Premium ($2/month ≈ PKR 500)</strong>.
            </p>
            <div className="pt-1 text-[10px] text-white/50 font-mono">
              Publisher ID: {publisherId} • Ad Slot: {slotId} • Status: {adError ? "Blocked/Offline" : "Active"}
            </div>
          </div>
        )}

        {/* Real Google AdSense <ins> Unit Container */}
        <div className="w-full flex items-center justify-center min-h-[90px] sm:min-h-[100px] overflow-hidden rounded-xl bg-black/20 border border-white/5 relative">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: "90px",
              textAlign: "center",
            }}
            data-ad-client={publisherId}
            data-ad-slot={slotId}
            data-ad-format={adFormat}
            data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
            data-adtest={isTestMode ? "on" : undefined}
          />

          {adError && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40 gap-1.5 p-2 text-center">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400/60" />
              <span>Ad space active (AdBlocker or network offline detected)</span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade to Premium Modal */}
      <PremiumUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </>
  );
}
