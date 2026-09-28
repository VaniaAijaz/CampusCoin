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
    <a href="#top" className="flex shrink-0 items-center gap-2.5 text-inherit no-underline" aria-label="CampusCoin home">
      <span className="relative block h-7 w-7 overflow-hidden rounded-[7px] bg-[var(--lp-blue)] shadow-sm">
        <span className="absolute left-0 top-0 h-[55%] w-full rounded-br-[10px] bg-[var(--lp-blue-soft)]" />
        <span className="absolute bottom-0 left-0 h-[50%] w-[52%] bg-[var(--lp-blue-deep)]" />
      </span>
      <span className="text-[18px] font-bold tracking-tight text-[var(--lp-foreground)]">
        Campus<span className="text-[var(--lp-blue)]">Coin</span>
      </span>
    </a>
  );
}

const navLinks = [
  { label: "Solutions", href: "#solutions" },
  { label: "Wallet", href: "#wallet" },
  { label: "Spending", href: "#spending" },
  { label: "Security", href: "#security" },
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
      {/* ── 1. Showcase Outer Frame (Hero) ── */}
      <div className="lp-showcase-frame mx-auto max-w-[1440px]">
        <section className="lp-showcase mx-auto max-w-[1320px]" aria-label="CampusCoin introduction">
          <div className="relative z-10 mx-auto max-w-[1140px] px-6 md:px-[55px]">
            {/* Header / Navbar */}
            <header className="flex h-[78px] items-center justify-between gap-4 md:h-[83px]">
              <Logo />

              {/* Desktop Nav */}
              <nav className="hidden items-center gap-[26px] text-[12px] font-semibold lg:flex" aria-label="Main navigation">
                <div className="relative">
                  <button
                    type="button"
                    className="lp-btn-ghost h-auto gap-1 p-0 text-[12px] font-semibold text-[var(--lp-foreground)] hover:text-[var(--lp-blue)]"
                    onClick={() => setProductsOpen(!productsOpen)}
                    aria-expanded={productsOpen}
                  >
                    Features <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {productsOpen && (
                    <div
                      className="absolute left-0 top-7 z-30 w-48 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-card)] p-2 shadow-xl"
                      onMouseLeave={() => setProductsOpen(false)}
                    >
                      <a
                        href="#wallet"
                        className="block rounded px-3 py-2 text-xs font-medium text-[var(--lp-foreground)] no-underline hover:bg-[var(--lp-secondary)]"
                        onClick={() => setProductsOpen(false)}
                      >
                        Student Wallet
                      </a>
                      <a
                        href="#spending"
                        className="block rounded px-3 py-2 text-xs font-medium text-[var(--lp-foreground)] no-underline hover:bg-[var(--lp-secondary)]"
                        onClick={() => setProductsOpen(false)}
                      >
                        Spending Insights
                      </a>
                      <a
                        href="#solutions"
                        className="block rounded px-3 py-2 text-xs font-medium text-[var(--lp-foreground)] no-underline hover:bg-[var(--lp-secondary)]"
                        onClick={() => setProductsOpen(false)}
                      >
                        Budget Tracker
                      </a>
                    </div>
                  )}
                </div>

                {navLinks.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-[var(--lp-foreground)] no-underline transition-colors hover:text-[var(--lp-blue)]"
                  >
                    {label}
                  </a>
                ))}
              </nav>

              {/* Right Side CTAs */}
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  to="/login"
                  className="lp-btn-ghost px-3.5 py-1.5 text-[12px] font-semibold text-[var(--lp-foreground)] hover:text-[var(--lp-blue)]"
                >
                  Log In
                </Link>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="lp-btn-showcase h-[34px] px-4 text-[11px] font-bold"
                >
                  Get Started
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="lp-btn-ghost p-2 lg:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </header>

            {/* Mobile Dropdown Nav */}
            {menuOpen && (
              <nav
                className="absolute left-6 right-6 top-[70px] z-40 flex flex-col gap-1.5 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-card)] p-4 text-sm shadow-2xl lg:hidden"
                aria-label="Mobile navigation"
              >
                {navLinks.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="rounded-lg px-3 py-2.5 font-medium text-[var(--lp-foreground)] no-underline hover:bg-[var(--lp-secondary)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </a>
                ))}
                <div className="mt-2 flex flex-col gap-2 border-t border-[var(--lp-border)] pt-3">
                  <Link
                    to="/login"
                    className="lp-btn-secondary h-9 w-full text-xs"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <button
                    type="button"
                    className="lp-btn-showcase h-9 w-full text-xs font-bold"
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
            <div className="relative pt-[14px] md:pt-[32px] lg:pt-[45px]">
              <div className="lp-eyebrow mb-[18px] inline-flex items-center gap-2 rounded-full px-3.5 py-[5px] text-[11px] font-medium text-[var(--lp-foreground)]">
                <span className="h-[8px] w-[8px] rounded-full bg-[var(--lp-blue)]" />
                Take control of your student finances
              </div>

              <h1 className="lp-display-heading max-w-[480px]">
                Smarter<br />
                Money for a<br />
                <span className="text-[var(--lp-blue)]">Brighter Campus</span>
              </h1>

              <p className="mt-[18px] max-w-[340px] text-[13px] leading-[1.6] text-[var(--lp-muted-foreground)]">
                A modern money experience for campus life. Make everyday payments, stay on top of spending, and focus on what matters.
              </p>

              {/* CTAs */}
              <div className="mt-[23px] flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="lp-btn-showcase h-[40px] gap-3 px-5 text-[12px] font-bold"
                >
                  Get Started
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lp-primary-foreground)] text-[var(--lp-primary)]">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
                <a
                  href="#solutions"
                  className="lp-btn-ghost h-[40px] gap-2 px-3 text-[12px] font-semibold text-[var(--lp-foreground)]"
                >
                  Explore features <ArrowRight className="h-3.5 w-3.5 text-[var(--lp-blue)]" />
                </a>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="relative z-20 mt-[29px] flex flex-wrap gap-x-[22px] gap-y-3 pb-8 md:mt-[58px]">
              <Feature icon={<Wallet className="h-4 w-4" />} title="Pay & Receive" detail="Everyday money" />
              <Feature
                icon={<BarChart3 className="h-4 w-4" />}
                title="Track Spending"
                detail="Stay in the know"
              />
              <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Built for Campus" detail="Made for students" />
            </div>
          </div>

          {/* Desktop Floating 3D Wallet Preview */}
          <div
            className="lp-hero-wallet pointer-events-none absolute right-[8%] top-[21%] z-10 hidden lg:block"
            aria-label="CampusCoin wallet preview"
          >
            <div className="lp-wallet-card pointer-events-auto relative">
              <div className="flex items-center gap-2 text-[16px] font-semibold">
                <span className="lp-wallet-mark inline-block h-[19px] w-[19px] rounded-[5px]" />
                CampusCoin
              </div>

              <div className="mt-[23px] text-[10px] uppercase tracking-wider opacity-80">Campus Wallet</div>

              <div className="mt-1 flex items-center gap-3 text-[25px] font-semibold tracking-tight">
                {balanceVisible ? "Rs 2,48,500" : "Rs ••,•••"}
                <button
                  type="button"
                  className="lp-wallet-eye"
                  aria-label={balanceVisible ? "Hide balance" : "Show balance"}
                  onClick={() => setBalanceVisible(!balanceVisible)}
                >
                  {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-[24px] flex justify-between text-center text-[10px] font-medium">
                {[
                  [<Send className="h-3.5 w-3.5" key="s" />, "Send"],
                  [<ArrowDownToLine className="h-3.5 w-3.5" key="r" />, "Receive"],
                  [<Wallet className="h-3.5 w-3.5" key="p" />, "Pay"],
                  [<span className="text-lg leading-none" key="m">••</span>, "More"],
                ].map(([icon, label], i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="lp-wallet-action flex h-8 w-8 items-center justify-center rounded-[11px]">
                      {icon}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Glass Notification 1 */}
            <div className="lp-notice right-[-36px] top-[97px]">
              <span className="lp-notice-icon-green flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-[7px]">
                <ArrowDownToLine className="h-3.5 w-3.5" />
              </span>
              <span className="text-[9px] leading-[1.45]">
                <strong className="block font-semibold text-[var(--lp-foreground)]">Money received</strong>
                <strong className="block font-semibold text-[oklch(0.36_0.12_147)]">+ Rs 7,500</strong>
                <span className="text-[var(--lp-muted-foreground)]">Today, 9:41 AM</span>
              </span>
            </div>

            {/* Floating Glass Notification 2 */}
            <div className="lp-notice right-[-16px] top-[180px]">
              <span className="lp-notice-icon-blue flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-[7px]">
                <BarChart3 className="h-3.5 w-3.5" />
              </span>
              <span className="text-[9px] leading-[1.45]">
                <strong className="block font-semibold text-[var(--lp-foreground)]">Spending insights</strong>
                <strong className="block font-semibold text-[var(--lp-blue)]">Stay on track</strong>
                <span className="text-[var(--lp-muted-foreground)]">Your money, clearer</span>
              </span>
            </div>
          </div>

          {/* Mobile Fallback Wallet Preview */}
          <div className="mt-3 px-8 pb-7 lg:hidden">
            <div className="lp-wallet-card relative mx-auto !h-[170px] !w-[290px] !rotate-[7deg] !skew-x-[-2deg]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="lp-wallet-mark inline-block h-4 w-4 rounded" />
                CampusCoin
              </div>
              <p className="mt-4 text-[10px] uppercase opacity-80">Campus Wallet</p>
              <p className="mt-1 text-2xl font-semibold">Rs 2,48,500</p>
              <div className="mt-3 flex justify-between text-xs">
                <span>Send</span>
                <span>Receive</span>
                <span>Pay</span>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Decorative Fine-Spaced Vertical Text */}
          <div className="lp-fine-spaced absolute bottom-[21%] right-[5%] hidden text-[8px] font-semibold leading-[1.65] text-[var(--lp-foreground)] lg:block">
            CAMPUS
            <br />
            MONEY
            <br />
            MADE
            <br />
            SIMPLE <span className="mt-2 block h-px w-5 bg-[var(--lp-foreground)]" />
          </div>
        </section>
      </div>

      {/* ── 2. Solutions Section ── */}
      <section id="solutions" className="lp-section-pad mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="lp-section-kicker">EVERYDAY, MADE EASIER</p>
            <h2 className="lp-section-heading mt-4">
              Everything your campus
              <br />
              day needs, in one place.
            </h2>
          </div>
          <p className="max-w-[320px] text-sm leading-7 text-[var(--lp-muted-foreground)]">
            From the small daily expenses to the bigger picture, your money should feel easy to understand.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a href="#wallet" className="lp-solution-card group">
            <span className="lp-solution-icon">
              <Wallet className="h-6 w-6" />
            </span>
            <span className="mt-auto">
              <span className="mb-2 flex items-center justify-between text-xl font-semibold text-[var(--lp-foreground)]">
                Campus wallet
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
              <span className="block text-sm leading-6 text-[var(--lp-muted-foreground)]">
                A simpler place for the money you use every day on campus.
              </span>
            </span>
          </a>

          <a href="#spending" className="lp-solution-card group">
            <span className="lp-solution-icon">
              <BarChart3 className="h-6 w-6" />
            </span>
            <span className="mt-auto">
              <span className="mb-2 flex items-center justify-between text-xl font-semibold text-[var(--lp-foreground)]">
                Spending insights
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
              <span className="block text-sm leading-6 text-[var(--lp-muted-foreground)]">
                See where your money goes and stay in the know with AI tips.
              </span>
            </span>
          </a>

          <a href="#security" className="lp-solution-card group">
            <span className="lp-solution-icon">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <span className="mt-auto">
              <span className="mb-2 flex items-center justify-between text-xl font-semibold text-[var(--lp-foreground)]">
                Peace of mind
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
              <span className="block text-sm leading-6 text-[var(--lp-muted-foreground)]">
                A student money experience designed to feel clear and in your control.
              </span>
            </span>
          </a>
        </div>
      </section>

      {/* ── 3. Interactive Wallet Section ── */}
      <section id="wallet" className="lp-section-band">
        <div className="lp-section-pad mx-auto grid max-w-[1200px] items-center gap-12 px-6 md:grid-cols-2 md:gap-20 md:px-10">
          <div>
            <p className="lp-section-kicker">YOUR CAMPUS WALLET</p>
            <h2 className="lp-section-heading mt-4">
              Money moves.
              <br />
              <span className="text-[var(--lp-blue)]">Keep up with it.</span>
            </h2>
            <p className="mt-5 max-w-[420px] text-sm leading-7 text-[var(--lp-muted-foreground)]">
              Whether you’re sending, receiving, or checking in on your balance, keep the everyday essentials close at
              hand.
            </p>
            <a
              href="#how-it-works"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lp-blue)] no-underline hover:underline"
            >
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lp-wallet-demo">
            <div className="lp-wallet-demo-top">
              <span className="text-sm font-semibold">Campus wallet</span>
              <Wallet className="h-5 w-5" />
            </div>
            <p className="mt-10 text-xs uppercase tracking-wider opacity-80">Available balance</p>
            <p className="mt-2 text-4xl font-semibold">Rs 2,48,500</p>
            <div className="mt-10 grid grid-cols-3 gap-2 border-t border-[rgba(255,255,255,0.25)] pt-5 text-center text-xs">
              <span className="flex flex-col items-center gap-2">
                <Send className="h-4 w-4" />
                Send
              </span>
              <span className="flex flex-col items-center gap-2">
                <ArrowDownLeft className="h-4 w-4" />
                Receive
              </span>
              <span className="flex flex-col items-center gap-2">
                <Wallet className="h-4 w-4" />
                Pay
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Spending Insights Section ── */}
      <section id="spending" className="lp-section-pad mx-auto grid max-w-[1200px] items-center gap-12 px-6 md:grid-cols-2 md:gap-20 md:px-10">
        <div className="lp-insights-demo order-2 md:order-1">
          <div className="flex items-center justify-between">
            <strong className="text-sm font-bold text-[var(--lp-foreground)]">Spending overview</strong>
            <span className="rounded-full bg-[var(--lp-secondary)] px-3 py-1 text-[11px] font-semibold text-[var(--lp-muted-foreground)]">
              This month
            </span>
          </div>
          <p className="mt-8 text-xs text-[var(--lp-muted-foreground)]">Your spending at a glance</p>
          <p className="mt-1 text-3xl font-bold text-[var(--lp-foreground)]">Rs 12,480</p>
          <div className="mt-8 flex h-28 items-end gap-3 border-b border-[var(--lp-border)] pb-1">
            {[42, 75, 55, 88, 62, 100, 70, 85].map((height, i) => (
              <span
                key={i}
                className="lp-insight-bar flex-1 rounded-t-md"
                style={{ height: `${height}%` }}
                title={`Period ${i + 1}`}
              />
            ))}
          </div>
          <div className="mt-5 flex justify-between text-[11px] text-[var(--lp-muted-foreground)]">
            <span>Stay in the know</span>
            <span className="flex items-center gap-1 font-semibold text-[var(--lp-blue)]">
              <BarChart3 className="h-3.5 w-3.5" /> Your overview
            </span>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <p className="lp-section-kicker">A CLEARER PICTURE</p>
          <h2 className="lp-section-heading mt-4">
            Know your money.
            <br />
            <span className="text-[var(--lp-blue)]">Own your day.</span>
          </h2>
          <p className="mt-5 max-w-[420px] text-sm leading-7 text-[var(--lp-muted-foreground)]">
            Keep an eye on your spending without getting lost in the details. The little things add up, and it helps to
            see them clearly.
          </p>
        </div>
      </section>

      {/* ── 5. Security & Care Section ── */}
      <section id="security" className="lp-section-band">
        <div className="lp-section-pad mx-auto grid max-w-[1200px] items-center gap-10 px-6 md:grid-cols-2 md:px-10">
          <div>
            <p className="lp-section-kicker">BUILT WITH CARE</p>
            <h2 className="lp-section-heading mt-4">
              Clarity looks good
              <br />
              on your money.
            </h2>
            <p className="mt-5 max-w-[430px] text-sm leading-7 text-[var(--lp-muted-foreground)]">
              Good money tools should help you feel informed. CampusCoin is designed around a straightforward view of
              your everyday student finances.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "See your balance in a glance",
              "Keep track of what comes and goes",
              "Made with campus life in mind",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 border-b border-[var(--lp-border)] py-5 text-sm font-medium text-[var(--lp-foreground)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--lp-blue-soft)] text-[var(--lp-blue)]">
                  <Check className="h-4 w-4" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. How It Works Section ── */}
      <section id="how-it-works" className="lp-section-pad mx-auto max-w-[1200px] px-6 md:px-10">
        <p className="lp-section-kicker">THE SIMPLE IDEA</p>
        <h2 className="lp-section-heading mt-4">
          Less thinking about money.
          <br />
          More living campus life.
        </h2>

        <div className="mt-12 grid gap-8 border-t border-[var(--lp-border)] pt-8 md:grid-cols-3">
          {[
            ["01", "Keep it together", "Your everyday money essentials, in one place."],
            ["02", "See it clearly", "Get a clearer view of your balance and spending."],
            ["03", "Move forward", "Make more room for the things you came to campus for."],
          ].map(([number, title, description]) => (
            <div key={number}>
              <span className="text-sm font-bold text-[var(--lp-blue)]">{number}</span>
              <h3 className="mt-4 text-xl font-semibold text-[var(--lp-foreground)]">{title}</h3>
              <p className="mt-2.5 max-w-[250px] text-sm leading-6 text-[var(--lp-muted-foreground)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Closing Band CTA ── */}
      <section id="about" className="lp-closing-band">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 px-6 py-20 md:flex-row md:items-end md:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-blue-soft)]">CAMPUSCOIN</p>
            <h2 className="lp-section-heading mt-5 text-[var(--lp-primary-foreground)]">
              A brighter way to
              <br />
              think about money.
            </h2>
            <p className="mt-5 max-w-[440px] text-sm leading-7 text-[rgba(255,255,255,0.75)]">
              CampusCoin is a money experience imagined around the rhythm of campus life.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGetStarted}
              className="lp-btn-secondary h-11 gap-2 px-6 text-sm"
            >
              Get Started <ArrowUpRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleTryDemo}
              className="lp-btn-ghost h-11 gap-2 px-4 text-sm font-bold text-white hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-[var(--lp-blue-soft)]" /> Try Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. Footer ── */}
      <footer className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-5 px-6 py-9 text-xs text-[var(--lp-muted-foreground)] md:flex-row md:items-center md:px-10">
        <Logo />
        <span>© {new Date().getFullYear()} CampusCoin. All rights reserved.</span>
        <a href="#top" className="inline-flex items-center gap-1 text-inherit no-underline hover:text-[var(--lp-blue)]">
          Back to top <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </footer>
    </main>
  );
}

function Feature({ icon, title, detail }) {
  return (
    <div className="flex items-center gap-2">
      <span className="lp-feature-icon flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]">
        {icon}
      </span>
      <span className="flex flex-col gap-[2px] whitespace-nowrap">
        <strong className="text-[10px] font-semibold text-[var(--lp-foreground)]">{title}</strong>
        <span className="text-[8px] text-[var(--lp-muted-foreground)]">{detail}</span>
      </span>
    </div>
  );
}
