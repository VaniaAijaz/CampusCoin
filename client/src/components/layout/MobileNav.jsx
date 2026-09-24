import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, BarChart2, Target, Lightbulb } from "lucide-react";

const MOBILE_ITEMS = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Home"         },
  { to: "/transactions", icon: ArrowLeftRight,  label: "Transactions" },
  { to: "/reports",      icon: BarChart2,       label: "Reports"      },
  { to: "/budget",       icon: Target,          label: "Budget"       },
  { to: "/insights",     icon: Lightbulb,       label: "Insights"     },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav" style={{ display: "none" }} id="mobile-bottom-nav">
      {MOBILE_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
        >
          <Icon size={20} strokeWidth={1.75} />
          <span>{label}</span>
        </NavLink>
      ))}
      <style>{`
        @media (max-width: 768px) {
          #mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
