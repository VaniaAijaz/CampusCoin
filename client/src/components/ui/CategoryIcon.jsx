import { 
  Utensils, Car, Zap, Film, ShoppingBag, HeartPulse, GraduationCap, Tag, Home, Smartphone
} from "lucide-react";

export default function CategoryIcon({ categoryName, className = "w-5 h-5", useEmerald = false }) {
  const name = (categoryName || "").toLowerCase();
  
  const getIcon = () => {
    if (name.includes("food") || name.includes("dining") || name.includes("eat")) return <Utensils className={className} />;
    if (name.includes("transport") || name.includes("gas") || name.includes("car") || name.includes("uber")) return <Car className={className} />;
    if (name.includes("util") || name.includes("electric") || name.includes("water") || name.includes("bill")) return <Zap className={className} />;
    if (name.includes("fun") || name.includes("entertainment") || name.includes("movie")) return <Film className={className} />;
    if (name.includes("shop") || name.includes("cloth") || name.includes("apparel")) return <ShoppingBag className={className} />;
    if (name.includes("health") || name.includes("medical") || name.includes("pharmacy")) return <HeartPulse className={className} />;
    if (name.includes("school") || name.includes("tuition") || name.includes("book") || name.includes("edu")) return <GraduationCap className={className} />;
    if (name.includes("rent") || name.includes("home") || name.includes("house")) return <Home className={className} />;
    if (name.includes("phone") || name.includes("mobile") || name.includes("internet")) return <Smartphone className={className} />;
    
    return <Tag className={className} />;
  };

  const glowClass = useEmerald 
    ? "shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400 bg-emerald-500/10" 
    : "shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-400 bg-blue-500/10";

  return (
    <div className={`flex items-center justify-center rounded-full border border-white/10 ${glowClass} ${className.includes('w-') ? 'p-2' : ''}`}>
      {getIcon()}
    </div>
  );
}
