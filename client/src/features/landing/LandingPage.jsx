import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Menu,
  Send,
  ShieldCheck,
  Wallet,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "./LandingPage.css";

function Logo() {
  return (
    <a href="#top" className="lp-logo" aria-label="CampusCoin home">
      <span className="lp-logo-mark">
        <span className="lp-logo-mark-top" />
        <span className="lp-logo-mark-bottom" />
      </span>
      <span className="lp-logo-text">CampusCoin</span>
    </a>
  );
}

const navLinks = [
  { label: "Solutions", href: "#solutions" },
  { label: "Security", href: "#security" },
  { label: "Company", href: "#about" },
  { label: "How it works", href: "#how-it-works" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, enterDemoMode } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      navigate("/register");
    }
  };

  const handleTryDemo = (e) => {
    e.preventDefault();
    if (enterDemoMode) {
      enterDemoMode();
      navigate("/app");
    } else {
      navigate("/demo");
    }
  };

  return (
    <main id="top" className="lp-root">
      {/* ── 1. Hero Full-Screen Canvas (Zero Outer Blue Borders) ── */}
      <section className="lp-hero-section" aria-label="CampusCoin introduction">
        <div className="lp-hero-container">
          {/* Header / Navbar */}
          <header className="lp-header">
            <Logo />

            {/* Desktop Nav */}
            <nav className="lp-desktop-nav" aria-label="Main navigation">
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="lp-btn-ghost"
                  style={{ height: "auto", padding: 0, gap: 6 }}
                  onClick={() => setProductsOpen(!productsOpen)}
                  aria-expanded={productsOpen}
                >
                  Products <ChevronDown style={{ width: 16, height: 16 }} />
                </button>
                {productsOpen && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 34,
                      zIndex: 30,
                      width: 210,
                      borderRadius: 12,
                      border: "1px solid var(--lp-border)",
                      backgroundColor: "var(--lp-card)",
                      padding: 10,
                      boxShadow: "0 14px 34px rgba(0,0,0,0.14)",
                    }}
                    onMouseLeave={() => setProductsOpen(false)}
                  >
                    <a
                      href="#wallet"
                      className="lp-mobile-nav-link"
                      onClick={() => setProductsOpen(false)}
                    >
                      Campus wallet
                    </a>
                    <a
                      href="#spending"
                      className="lp-mobile-nav-link"
                      onClick={() => setProductsOpen(false)}
                    >
                      Spending insights
                    </a>
                  </div>
                )}
              </div>

              {navLinks.map(({ label, href }) => (
                <a key={label} href={href} className="lp-nav-link">
                  {label}
                </a>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="lp-desktop-actions">
              <Link
                to="/login"
                className="lp-btn-ghost"
                style={{ padding: "10px 20px", height: "auto", fontSize: "16px" }}
              >
                Log In
              </Link>
              <button
                type="button"
                onClick={handleGetStarted}
                className="lp-btn-primary"
                style={{ height: 48, padding: "0 26px", borderRadius: 16, fontSize: "16px" }}
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="lp-mobile-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X style={{ width: 26, height: 26 }} /> : <Menu style={{ width: 26, height: 26 }} />}
            </button>
          </header>

          {/* Mobile Dropdown Nav */}
          {menuOpen && (
            <nav className="lp-mobile-nav" aria-label="Mobile navigation">
              {[{ label: "Products", href: "#wallet" }, ...navLinks].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="lp-mobile-nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--lp-border)", paddingTop: 14 }}>
                <Link
                  to="/login"
                  className="lp-btn-secondary"
                  style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 15 }}
                  onClick={() => setMenuOpen(false)}
                >
                  Log In
                </Link>
                <button
                  type="button"
                  className="lp-btn-primary"
                  style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 15 }}
                  onClick={() => {
                    setMenuOpen(false);
                    handleGetStarted();
                  }}
                >
                  Get Started
                </button>
              </div>
            </nav>
          )}

          {/* Hero Main Content */}
          <div className="lp-hero-content">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" />
              Money for the Way You Move
            </div>

            <h1 className="lp-display-heading">
              Smarter
              <br />
              Money for a
              <br />
              <span className="lp-text-blue">Brighter Campus</span>
            </h1>

            <p className="lp-hero-desc">
              A modern money experience for campus life. Make everyday payments, stay on top of spending, and focus
              on what matters.
            </p>

            {/* Hero CTAs */}
            <div className="lp-hero-ctas">
              <button type="button" onClick={handleGetStarted} className="lp-btn-primary">
                Get Started
                <span className="lp-btn-circle-arrow">
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </span>
              </button>
              <a href="#solutions" className="lp-btn-ghost">
                Explore features <ArrowRight style={{ width: 16, height: 16 }} />
              </a>
            </div>
          </div>

          {/* Bottom 3 Feature Pills */}
          <div className="lp-features-strip">
            <Feature icon={<Wallet style={{ width: 22, height: 22 }} />} title="Pay & Receive" detail="Everyday money" />
            <Feature
              icon={<BarChart3 style={{ width: 22, height: 22 }} />}
              title="Track Spending"
              detail="Stay in the know"
            />
            <Feature
              icon={<ShieldCheck style={{ width: 22, height: 22 }} />}
              title="Built for Campus"
              detail="Made for students"
            />
          </div>
        </div>

        {/* Desktop Floating 3D Wallet Preview */}
        <div className="lp-hero-wallet" aria-label="CampusCoin wallet preview">
          <div className="lp-wallet-card">
            <div className="lp-wallet-top">
              <span className="lp-wallet-mark" />
              CampusCoin
            </div>

            <div className="lp-wallet-sub">Campus Wallet</div>

            <div className="lp-wallet-balance-row">
              {balanceVisible ? "₹ 2,48,500" : "₹ ••,•••"}
              <button
                type="button"
                className="lp-wallet-eye"
                aria-label={balanceVisible ? "Hide balance" : "Show balance"}
                onClick={() => setBalanceVisible(!balanceVisible)}
              >
                {balanceVisible ? (
                  <Eye style={{ width: 19, height: 19 }} />
                ) : (
                  <EyeOff style={{ width: 19, height: 19 }} />
                )}
              </button>
            </div>

            <div className="lp-wallet-actions">
              {[
                [<Send style={{ width: 19, height: 19 }} key="s" />, "Send"],
                [<ArrowDownToLine style={{ width: 19, height: 19 }} key="r" />, "Receive"],
                [<Wallet style={{ width: 19, height: 19 }} key="p" />, "Pay"],
                [<span style={{ fontSize: 22, lineHeight: 1 }} key="m">••</span>, "More"],
              ].map(([icon, label], i) => (
                <div key={i} className="lp-wallet-action-col">
                  <span className="lp-wallet-action-btn">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Floating Glass Notification 1 */}
          <div className="lp-notice lp-notice-1">
            <span className="lp-notice-icon-green">
              <ArrowDownToLine style={{ width: 18, height: 18 }} />
            </span>
            <span className="lp-notice-text">
              <strong>Money received</strong>
              <strong style={{ color: "oklch(0.36 0.12 147)" }}>+ ₹75.00</strong>
              <span>Today, 9:41 AM</span>
            </span>
          </div>

          {/* Floating Glass Notification 2 */}
          <div className="lp-notice lp-notice-2">
            <span className="lp-notice-icon-blue">
              <BarChart3 style={{ width: 18, height: 18 }} />
            </span>
            <span className="lp-notice-text">
              <strong>Spending insights</strong>
              <strong style={{ color: "var(--lp-blue)" }}>Stay on track</strong>
              <span>Your money, clearer</span>
            </span>
          </div>
        </div>

        {/* Mobile Wallet Fallback */}
        <div className="lp-mobile-wallet-container">
          <div className="lp-wallet-card lp-mobile-wallet-card">
            <div className="lp-wallet-top" style={{ fontSize: 17 }}>
              <span className="lp-wallet-mark" style={{ width: 19, height: 19 }} />
              CampusCoin
            </div>
            <p className="lp-wallet-sub" style={{ marginTop: 22 }}>Campus Wallet</p>
            <p className="lp-wallet-balance-row" style={{ fontSize: 28, margin: "4px 0 0" }}>₹ 2,48,500</p>
            <div className="lp-wallet-actions" style={{ marginTop: 20 }}>
              <span>Send</span>
              <span>Receive</span>
              <span>Pay</span>
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Decorative Fine-Spaced Side Text */}
        <div className="lp-fine-spaced">
          CAMPUS
          <br />
          MONEY
          <br />
          MADE
          <br />
          SIMPLE
          <span className="lp-fine-spaced-line" />
        </div>
      </section>

      {/* ── 2. Solutions Section ── */}
      <section id="solutions" className="lp-section-pad">
        <div className="lp-solutions-header">
          <div>
            <p className="lp-section-kicker">EVERYDAY, MADE EASIER</p>
            <h2 className="lp-section-heading">
              Everything your campus
              <br />
              day needs, in one place.
            </h2>
          </div>
          <p className="lp-solutions-desc">
            From the small daily expenses to the bigger picture, your money should feel easy to understand.
          </p>
        </div>

        <div className="lp-solutions-grid">
          <a href="#wallet" className="lp-solution-card">
            <span className="lp-solution-icon">
              <Wallet style={{ width: 30, height: 30 }} />
            </span>
            <span className="lp-solution-bottom">
              <span className="lp-solution-title-row">
                Campus wallet
                <ArrowUpRight style={{ width: 24, height: 24, transition: "transform 0.2s" }} />
              </span>
              <span className="lp-solution-desc">A simpler place for the money you use every day.</span>
            </span>
          </a>

          <a href="#spending" className="lp-solution-card">
            <span className="lp-solution-icon">
              <BarChart3 style={{ width: 30, height: 30 }} />
            </span>
            <span className="lp-solution-bottom">
              <span className="lp-solution-title-row">
                Spending insights
                <ArrowUpRight style={{ width: 24, height: 24, transition: "transform 0.2s" }} />
              </span>
              <span className="lp-solution-desc">See where your money goes and stay in the know.</span>
            </span>
          </a>

          <a href="#security" className="lp-solution-card">
            <span className="lp-solution-icon">
              <ShieldCheck style={{ width: 30, height: 30 }} />
            </span>
            <span className="lp-solution-bottom">
              <span className="lp-solution-title-row">
                Peace of mind
                <ArrowUpRight style={{ width: 24, height: 24, transition: "transform 0.2s" }} />
              </span>
              <span className="lp-solution-desc">
                A money experience designed to feel clear and in your control.
              </span>
            </span>
          </a>
        </div>
      </section>

      {/* ── 3. Interactive Wallet Section ── */}
      <section id="wallet" className="lp-section-band">
        <div className="lp-section-pad lp-two-col-grid">
          <div>
            <p className="lp-section-kicker">YOUR CAMPUS WALLET</p>
            <h2 className="lp-section-heading" style={{ marginTop: 16 }}>
              Money moves.
              <br />
              <span className="lp-text-blue">Keep up with it.</span>
            </h2>
            <p className="lp-solutions-desc" style={{ maxWidth: 460, marginTop: 24 }}>
              Whether you’re sending, receiving, or checking in on your balance, keep the everyday essentials close at
              hand.
            </p>
            <a
              href="#how-it-works"
              style={{
                marginTop: 38,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--lp-blue)",
                textDecoration: "none",
              }}
            >
              See how it works <ArrowRight style={{ width: 20, height: 20 }} />
            </a>
          </div>

          <div className="lp-wallet-demo">
            <div className="lp-wallet-demo-top">
              <span>Campus wallet</span>
              <Wallet style={{ width: 24, height: 24 }} />
            </div>
            <p className="lp-wallet-demo-label">Available balance</p>
            <p className="lp-wallet-demo-val">₹ 2,48,500</p>
            <div className="lp-wallet-demo-grid">
              <span className="lp-wallet-demo-action">
                <Send style={{ width: 22, height: 22 }} />
                Send
              </span>
              <span className="lp-wallet-demo-action">
                <ArrowDownLeft style={{ width: 22, height: 22 }} />
                Receive
              </span>
              <span className="lp-wallet-demo-action">
                <Wallet style={{ width: 22, height: 22 }} />
                Pay
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Spending Insights Section ── */}
      <section id="spending" className="lp-section-pad lp-two-col-grid">
        <div className="lp-insights-demo" style={{ order: 2 }}>
          <div className="lp-insights-top">
            <strong style={{ fontSize: 17, color: "var(--lp-foreground)" }}>Spending overview</strong>
            <span className="lp-insights-badge">This month</span>
          </div>
          <p className="lp-insights-label">Your spending at a glance</p>
          <p className="lp-insights-amount">₹ 12,480</p>
          <div className="lp-chart-bars">
            {[42, 75, 55, 88, 62, 100, 70, 85].map((height, i) => (
              <span
                key={i}
                className="lp-insight-bar"
                style={{ height: `${height}%` }}
                title={`Day ${i + 1}`}
              />
            ))}
          </div>
          <div className="lp-insights-footer">
            <span>Stay in the know</span>
            <span className="lp-insights-footer-link">
              <BarChart3 style={{ width: 17, height: 17 }} /> Your overview
            </span>
          </div>
        </div>

        <div style={{ order: 1 }}>
          <p className="lp-section-kicker">A CLEARER PICTURE</p>
          <h2 className="lp-section-heading" style={{ marginTop: 16 }}>
            Know your money.
            <br />
            <span className="lp-text-blue">Own your day.</span>
          </h2>
          <p className="lp-solutions-desc" style={{ maxWidth: 460, marginTop: 24 }}>
            Keep an eye on your spending without getting lost in the details. The little things add up, and it helps to
            see them clearly.
          </p>
        </div>
      </section>

      {/* ── 5. Security & Care Section ── */}
      <section id="security" className="lp-section-band">
        <div className="lp-section-pad lp-two-col-grid" style={{ gap: 52 }}>
          <div>
            <p className="lp-section-kicker">BUILT WITH CARE</p>
            <h2 className="lp-section-heading" style={{ marginTop: 16 }}>
              Clarity looks good
              <br />
              on your money.
            </h2>
            <p className="lp-solutions-desc" style={{ maxWidth: 470, marginTop: 24 }}>
              Good money tools should help you feel informed. CampusCoin is designed around a straightforward view of
              your everyday finances.
            </p>
          </div>

          <div className="lp-checklist">
            {[
              "See your balance in a glance",
              "Keep track of what comes and goes",
              "Made with campus life in mind",
            ].map((item) => (
              <div key={item} className="lp-check-item">
                <span className="lp-check-icon">
                  <Check style={{ width: 20, height: 20 }} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. How It Works Section ── */}
      <section id="how-it-works" className="lp-section-pad">
        <p className="lp-section-kicker">THE SIMPLE IDEA</p>
        <h2 className="lp-section-heading" style={{ marginTop: 16 }}>
          Less thinking about money.
          <br />
          More living campus life.
        </h2>

        <div className="lp-steps-grid">
          {[
            ["01", "Keep it together", "Your everyday money essentials, in one place."],
            ["02", "See it clearly", "Get a clearer view of your balance and spending."],
            ["03", "Move forward", "Make more room for the things you came to campus for."],
          ].map(([number, title, description]) => (
            <div key={number}>
              <span className="lp-step-number">{number}</span>
              <h3 className="lp-step-title">{title}</h3>
              <p className="lp-step-desc">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Closing Band CTA ── */}
      <section id="about" className="lp-closing-band">
        <div className="lp-closing-inner">
          <div>
            <p className="lp-closing-kicker">CAMPUSCOIN</p>
            <h2 className="lp-closing-heading">
              A brighter way to
              <br />
              think about money.
            </h2>
            <p className="lp-closing-desc">
              CampusCoin is a money experience imagined around the rhythm of campus life.
            </p>
          </div>
          <div className="lp-closing-actions">
            <button type="button" onClick={handleGetStarted} className="lp-btn-secondary">
              Get Started <ArrowUpRight style={{ width: 20, height: 20 }} />
            </button>
            <button
              type="button"
              onClick={handleTryDemo}
              className="lp-btn-ghost"
              style={{ color: "#fff", height: 54, padding: "0 24px", fontSize: 16, fontWeight: 700 }}
            >
              <Sparkles style={{ width: 20, height: 20, color: "var(--lp-blue-soft)" }} /> Try Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ── */}
      <footer className="lp-footer">
        <Logo />
        <span>© {new Date().getFullYear()} CampusCoin. All rights reserved.</span>
        <a href="#top" className="lp-back-to-top">
          Back to top <ArrowUpRight style={{ width: 18, height: 18 }} />
        </a>
      </footer>
    </main>
  );
}

function Feature({ icon, title, detail }) {
  return (
    <div className="lp-feature-item">
      <span className="lp-feature-icon">{icon}</span>
      <span className="lp-feature-text">
        <strong className="lp-feature-title">{title}</strong>
        <span className="lp-feature-detail">{detail}</span>
      </span>
    </div>
  );
}
