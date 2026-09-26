import { useState } from "react";

// Pre-mapped popular student subscriptions dictionary
const DOMAIN_MAP = {
  netflix: "netflix.com",
  spotify: "spotify.com",
  youtube: "youtube.com",
  amazon: "amazon.com",
  prime: "amazon.com",
  github: "github.com",
  chatgpt: "openai.com",
  openai: "openai.com",
  adobe: "adobe.com",
  apple: "apple.com",
  disney: "disneyplus.com",
  hulu: "hulu.com",
  canva: "canva.com",
  figma: "figma.com",
  notion: "notion.so",
  dropbox: "dropbox.com",
  google: "google.com",
  duolingo: "duolingo.com",
  coursera: "coursera.org",
  udemy: "udemy.com",
  chegg: "chegg.com",
  grammarly: "grammarly.com",
};

/**
 * Converts a company or subscription name to a valid domain
 */
export function getSubscriptionDomain(name = "") {
  if (!name) return "";
  const cleaned = name.trim().toLowerCase();
  
  // Check mapped dictionary
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (cleaned.includes(key)) return domain;
  }

  // Strip spaces, punctuation, and append .com
  const stripped = cleaned.replace(/[^a-z0-9]/g, "");
  return stripped ? `${stripped}.com` : "";
}

/**
 * Logo.dev Subscription Brand Logo Component
 */
export default function SubscriptionLogo({ name, serviceName, className = "w-10 h-10" }) {
  const companyName = name || serviceName || "Subscription";
  const [hasError, setHasError] = useState(false);

  const mappedDomain = getSubscriptionDomain(companyName);
  const token = import.meta.env.VITE_LOGODEV_SECRET_KEY || "";
  const logoUrl = mappedDomain && token
    ? `https://img.logo.dev/${mappedDomain}?token=${token}`
    : mappedDomain
    ? `https://img.logo.dev/${mappedDomain}`
    : "";

  const initial = companyName.charAt(0).toUpperCase() || "S";

  return (
    <div
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/20 shadow-md ${className}`}
    >
      {!hasError && logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName}
          className="w-10 h-10 rounded-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary/40 to-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-sm shadow-inner">
          {initial}
        </div>
      )}
    </div>
  );
}
