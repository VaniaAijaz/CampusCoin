import { Link } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, BarChart2, Target,
  Tag, Lightbulb, Settings, Shield, Map,
  LogIn, UserPlus, KeyRound, Mail,
  TrendingUp, TrendingDown, PieChart, Calendar,
  Wallet, Bookmark, Pin, Upload, Users, Megaphone
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/ui/PageHeader";

const SITEMAP = [
  {
    section: "Main Application",
    color: "var(--color-brand)",
    pages: [
      { path: "/dashboard",    icon: LayoutDashboard, label: "Dashboard",    desc: "Overview of income, expenses, balance, charts, recent transactions and saving tips." },
      { path: "/transactions", icon: ArrowLeftRight,  label: "Transactions", desc: "Add, edit, delete income and expense transactions. Filter, search, import CSV." },
      { path: "/reports",      icon: BarChart2,       label: "Reports",      desc: "Monthly reports, category breakdown, 6-month trends, daily summaries. PDF export." },
      { path: "/budget",       icon: Target,          label: "Budget Goals", desc: "Set monthly budgets per category, track spending in real time, receive alerts." },
      { path: "/categories",   icon: Tag,             label: "Categories",   desc: "Manage personal income and expense categories with custom names and colors." },
      { path: "/insights",     icon: Lightbulb,       label: "AI Insights",  desc: "AI-generated monthly summaries, flagged spending patterns, saving tips and recommendations." },
      { path: "/profile",      icon: Settings,        label: "Settings",     desc: "Edit profile, change password, toggle dark mode, adjust font size, import data." },
      { path: "/sitemap",      icon: Map,             label: "Sitemap",      desc: "This page — visual overview of all application pages and features." },
    ],
  },
  {
    section: "Authentication",
    color: "var(--color-secondary)",
    pages: [
      { path: "/login",              icon: LogIn,   label: "Sign In",         desc: "Student and admin login with email and password." },
      { path: "/register",           icon: UserPlus,label: "Register",        desc: "Create a free student account with optional profile fields." },
      { path: "/forgot-password",    icon: Mail,    label: "Forgot Password", desc: "Request a password reset link via email." },
      { path: "/reset-password/:t",  icon: KeyRound,label: "Reset Password",  desc: "Set a new password using the emailed reset token." },
    ],
  },
  {
    section: "Dashboard Features",
    color: "var(--color-gold)",
    icon: true,
    features: [
      { icon: TrendingUp,   label: "Income Tracking",     desc: "Log allowance, scholarships, part-time income, gifts." },
      { icon: TrendingDown, label: "Expense Tracking",    desc: "Log food, transport, rent, academics, subscriptions, entertainment." },
      { icon: PieChart,     label: "Category Charts",     desc: "Doughnut chart of spending distribution per category." },
      { icon: BarChart2,    label: "6-Month Trends",      desc: "Bar chart comparing income vs expenses over 6 months." },
      { icon: Calendar,     label: "Daily Summary",       desc: "Line chart of daily income and expense activity." },
      { icon: Wallet,       label: "Balance Widget",      desc: "Real-time current month balance display." },
      { icon: Target,       label: "Budget Progress",     desc: "Progress bars showing budget vs actual spending." },
      { icon: Lightbulb,    label: "Saving Tips",         desc: "Personalised tips ranked by potential savings impact." },
      { icon: Bookmark,     label: "Bookmark Insights",   desc: "Save monthly insights for future reference." },
      { icon: Pin,          label: "Pin Insights",        desc: "Pin important insights to the top of your list." },
      { icon: Upload,       label: "CSV Import",          desc: "Bulk import historical transactions from a CSV file." },
    ],
  },
];

const ADMIN_SECTION = {
  section: "Admin Panel",
  color: "var(--color-danger)",
  pages: [
    { path: "/admin", icon: Shield,   label: "Admin Overview",    desc: "Platform statistics: total users, transactions, most-used categories." },
    { path: "/admin", icon: Users,    label: "User Management",   desc: "View, enable, disable or delete student accounts." },
    { path: "/admin", icon: Tag,      label: "Category Admin",    desc: "Create, edit or remove default system-wide categories." },
    { path: "/admin", icon: Megaphone,label: "Announcements",     desc: "Create info, tip or warning announcements visible to all students." },
  ],
};

export default function SitemapPage() {
  const { isAdmin } = useAuth();
  const sections = isAdmin ? [...SITEMAP, ADMIN_SECTION] : SITEMAP;

  return (
    <div className="page-content">
      <PageHeader
        title="Sitemap"
        subtitle="Complete overview of all Campus Coin pages and features."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {sections.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 14,
            }}>
              <div style={{
                width: 4, height: 20, borderRadius: 2,
                background: section.color,
              }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-dark)" }}>
                {section.section}
              </div>
            </div>

            {/* Pages grid */}
            {section.pages && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {section.pages.map((page, pi) => (
                  <Link key={pi} to={page.path.includes(":") ? "#" : page.path} style={{ textDecoration: "none" }}>
                    <div className="cc-card" style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      cursor: "pointer", transition: "border-color 150ms, box-shadow 150ms",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = section.color; e.currentTarget.style.boxShadow = `0 2px 12px ${section.color}18`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
                    >
                      <div className="icon-box" style={{ background: `${section.color}14`, color: section.color, flexShrink: 0 }}>
                        <page.icon size={17} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-dark)", marginBottom: 3 }}>
                          {page.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-subtle)", lineHeight: 1.5 }}>
                          {page.desc}
                        </div>
                        <div style={{ fontSize: 11, color: section.color, marginTop: 5, fontWeight: 500, opacity: 0.8 }}>
                          {page.path.includes(":") ? "" : page.path}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Features grid (no links) */}
            {section.features && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {section.features.map((feat, fi) => (
                  <div key={fi} className="cc-card" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px 16px" }}>
                    <div className="icon-box" style={{ background: `${section.color}14`, color: section.color, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                      <feat.icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-dark)", marginBottom: 2 }}>{feat.label}</div>
                      <div style={{ fontSize: 11, color: "var(--color-subtle)", lineHeight: 1.5 }}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer note */}
        <div style={{
          background: "var(--color-brand-light)", borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div className="icon-box" style={{ background: "var(--color-brand)", color: "#fff", flexShrink: 0 }}>
            <Map size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-brand)" }}>Campus Coin — Smart Spending, Student Style</div>
            <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 2 }}>
              Built with React · Node.js · Express · MongoDB · Tailwind CSS v4 · Chart.js
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
