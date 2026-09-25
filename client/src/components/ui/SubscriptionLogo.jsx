import { useState } from "react";
import { CreditCard } from "lucide-react";

export default function SubscriptionLogo({ serviceName, className = "w-10 h-10" }) {
  const [error, setError] = useState(false);

  // Simple heuristic to get a domain name. 
  // e.g. "Spotify" -> "spotify.com"
  // "Adobe Creative Cloud" -> "adobe.com"
  const getDomain = (name) => {
    if (!name) return "";
    const primaryWord = name.trim().split(" ")[0].toLowerCase();
    return `${primaryWord}.com`;
  };

  const domain = getDomain(serviceName);
  const logoUrl = `https://logo.dev/${domain}`;

  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-full bg-black/20 p-2 border border-white/10 overflow-hidden backdrop-blur-md ${className}`}>
      {!error && domain ? (
        <img 
          src={logoUrl} 
          alt={serviceName} 
          className="w-full h-full object-contain"
          onError={() => setError(true)}
        />
      ) : (
        <CreditCard className="w-full h-full text-brand-primary p-1 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
      )}
    </div>
  );
}
