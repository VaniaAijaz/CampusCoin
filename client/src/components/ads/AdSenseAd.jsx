import { useState, useEffect, useRef } from "react";
import { Info, Crown, X, Sparkles, ExternalLink, GraduationCap, Laptop, BookOpen, Music } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

/**
 * Curated Campus & Student Sponsor Creatives.
 * Displayed dynamically when Google AdSense is unfilled (e.g., localhost, test mode, pending inventory).
 */
const STUDENT_SPONSOR_ADS = [
  {
    id: "github-pack",
    badge: "Student Partner",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    title: "GitHub Student Developer Pack",
    desc: "Get $200k+ in free developer tools, cloud hosting credits & GitHub Copilot with your student email.",
    cta: "Claim Free Pack",
    url: "https://education.github.com/pack",
    icon: Laptop,
    gradient: "from-purple-900/40 via-indigo-900/20 to-blue-900/40",
  },
  {
    id: "coursera-tech",
    badge: "Academic Deal",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    title: "Coursera Campus Learning Pass",
    desc: "Level up your resume with 50% discount on Google, IBM & Meta professional certifications.",
    cta: "Explore Courses",
    url: "https://www.coursera.org/campus",
    icon: BookOpen,
    gradient: "from-blue-900/40 via-cyan-900/20 to-teal-900/40",
  },
  {
    id: "spotify-student",
    badge: "Campus Lifestyle",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    title: "Spotify Student + Hulu Bundle",
    desc: "Stream unlimited music and TV shows ad-free for just $5.99/month with student verification.",
    cta: "Get Student Plan",
    url: "https://www.spotify.com/us/student/",
    icon: Music,
    gradient: "from-emerald-900/40 via-teal-900/20 to-cyan-900/40",
  },
  {
    id: "campus-internships",
    badge: "Career Hub",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    title: "Techwiz 2026 Student Innovators",
    desc: "Connect with tech mentors, submit your fintech projects, and win global scholarship prizes.",
    cta: "Learn More",
    url: "https://techwiz.world",
    icon: GraduationCap,
    gradient: "from-amber-900/40 via-orange-900/20 to-rose-900/40",
  },
];

/**
 * Singleton Script Loader for Google AdSense SDK.
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

export default function AdSenseAd({
  slot = "dashboard",
  slotId: explicitSlotId,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
  delayMs = 2000,
}) {
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isReadyToShow, setIsReadyToShow] = useState(false);
  const [isGoogleFilled, setIsGoogleFilled] = useState(false);

  // Randomize initial sponsor ad index for varied presentation
  const [sponsorAdIndex] = useState(() => Math.floor(Math.random() * STUDENT_SPONSOR_ADS.length));
  const activeSponsor = STUDENT_SPONSOR_ADS[sponsorAdIndex] || STUDENT_SPONSOR_ADS[0];
  const SponsorIcon = activeSponsor.icon;

  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // 1. STRICT AD-FREE CHECK: Free users see ads; Premium users ($2/month ≈ PKR 500) see NO ads!
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

  // 3. Isolated DOM Insertion & Safe Cleanup to Prevent React Reconciliation Collisions
  useEffect(() => {
    let isMounted = true;

    const showTimer = setTimeout(() => {
      if (!isMounted) return;
      setIsReadyToShow(true);

      loadAdSenseScriptOnce(publisherId)
        .then(() => {
          if (!isMounted || !containerRef.current) return;

          try {
            // Safely clear previous unmanaged nodes before injecting
            containerRef.current.innerHTML = "";

            const ins = document.createElement("ins");
            ins.className = "adsbygoogle";
            ins.style.display = "block";
            ins.style.width = "100%";
            ins.style.minHeight = "90px";
            ins.style.textAlign = "center";
            ins.style.backgroundColor = "transparent";

            ins.setAttribute("data-ad-client", publisherId);
            ins.setAttribute("data-ad-slot", slotId);
            ins.setAttribute("data-ad-format", adFormat);
            ins.setAttribute("data-full-width-responsive", fullWidthResponsive ? "true" : "false");
            if (isTestMode) {
              ins.setAttribute("data-adtest", "on");
            }

            containerRef.current.appendChild(ins);

            // Push to AdSense queue
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (_) {}

            // Observe fill status
            if (observerRef.current) {
              observerRef.current.disconnect();
            }

            const observer = new MutationObserver(() => {
              if (!isMounted) return;
              const adStatus = ins.getAttribute("data-ad-status");
              if (adStatus === "filled") {
                setIsGoogleFilled(true);
              } else if (adStatus === "unfilled") {
                setIsGoogleFilled(false);
              }
            });

            observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
            observerRef.current = observer;
          } catch (err) {
            console.warn("[AdSense Diagnostics] Safe mount fallback:", err);
          }
        })
        .catch(() => {
          // Fall back to student sponsor banner
        });
    }, delayMs);

    return () => {
      isMounted = false;
      clearTimeout(showTimer);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [publisherId, slotId, delayMs, isTestMode, adFormat, fullWidthResponsive]);

  if (!isReadyToShow) {
    return null;
  }

  return (
    <>
      <div
        className={`relative w-full rounded-2xl bg-[#0a0f1d]/90 backdrop-blur-xl border border-white/10 shadow-lg text-white transition-all overflow-hidden p-3.5 sm:p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${className}`}
      >
        {/* Advertisement Header Label & Actions */}
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
              Google AdSense & Student Sponsorship
            </p>
            <p className="text-[11px] text-white/70 leading-relaxed">
              This ad space supports CampusCoin’s free tier for students. You can eliminate all advertisements across the platform at any time by upgrading to{" "}
              <strong className="text-amber-300">CampusCoin Premium ($2/month ≈ PKR 500)</strong>.
            </p>
            <div className="pt-1 text-[10px] text-white/50 font-mono">
              Publisher ID: {publisherId} • Ad Slot: {slotId} • Status: {isGoogleFilled ? "Google Live Creative" : "Sponsor Creative Active"}
            </div>
          </div>
        )}

        {/* Ad Container: Never Shows Raw White Boxes and Prevents React DOM Conflicts */}
        <div className="w-full relative rounded-xl overflow-hidden min-h-[90px] flex items-center justify-center bg-black/25 border border-white/5">
          {/* Isolated Container for Imperatively Mounted Google Ad (Zero React Node Reconciliation Error) */}
          <div
            ref={containerRef}
            className={`w-full ${isGoogleFilled ? "block" : "hidden"}`}
            style={{ minHeight: isGoogleFilled ? "90px" : "0" }}
          />

          {/* High-Converting Glassmorphic Student Sponsor Banner (Shown if Google is unfilled, testing, or offline) */}
          {!isGoogleFilled && (
            <div
              className={`w-full p-3.5 sm:p-4 rounded-xl bg-gradient-to-r ${activeSponsor.gradient} border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white shadow-inner">
                  <SponsorIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white truncate">{activeSponsor.title}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${activeSponsor.badgeColor}`}>
                      {activeSponsor.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                    {activeSponsor.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <a
                  href={activeSponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
                >
                  <span>{activeSponsor.cta}</span>
                  <ExternalLink className="w-3 h-3 text-white/80" />
                </a>
              </div>
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

