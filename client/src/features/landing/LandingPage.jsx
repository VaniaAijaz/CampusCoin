import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Coins,
  Sparkles,
  Target,
  FileText,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Banknote,
  Shield,
  PieChart,
  Calendar,
  Check,
} from "lucide-react";
import Iridescence from "../../components/ui/Iridescence";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../auth/AuthContext";

gsap.registerPlugin(ScrollTrigger);

// Physical Spatial Glass Recipe for Cards
const glassCard =
  "base-glass glass-card bg-white/[0.03] backdrop-blur-[64px] backdrop-saturate-[120%] border border-white/10 border-t-white/20 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-3xl transform-gpu backface-hidden";

/** Magnetic hover button */
function MagneticButton({ children, className, to, href, onClick }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
    el.style.transform = `translate(${x}px,${y}px)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  const style = { transition: "transform 0.3s cubic-bezier(.22,1,.36,1)" };
  if (to)
    return (
      <Link
        to={to}
        ref={ref}
        className={className}
        style={style}
        onClick={onClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
      </Link>
    );
  if (onClick)
    return (
      <button
        type="button"
        ref={ref}
        className={className}
        style={style}
        onClick={onClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
      </button>
    );
  return (
    <a
      href={href}
      ref={ref}
      className={className}
      style={style}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </a>
  );
}

export default function LandingPage() {
  const { color } = useTheme();
  const navigate = useNavigate();
  const { enterDemoMode } = useAuth();
  const containerRef = useRef(null);

  const handleLaunchFreeDemo = () => {
    enterDemoMode();
    navigate("/dashboard");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Section Staggered Mask Reveal
      gsap.from(".hero-word", {
        y: 40,
        opacity: 0,
        stagger: 0.05,
        duration: 1.0,
        ease: "power4.out",
        delay: 0.15,
      });

      gsap.from(".hero-sub", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.45,
      });

      // 2. Scroll-Linked Parallax Background
      gsap.to(".parallax-bg", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      // 3. Feature Cards Batch Reveal via ScrollTrigger
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".feature-grid",
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "back.out(1.2)",
      });

      // 4. Sticky Scroll Section Pinning (Desktop >= 1024px)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: ".sticky-showcase-section",
          start: "top 12%",
          end: "bottom 90%",
          pin: ".sticky-showcase-left",
          pinSpacing: true,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const headlineWords = ["Campus", "Coin.", "Your", "money,", "finally", "making", "sense."];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#07090E] text-white font-sans overflow-x-hidden selection:bg-white/20 selection:text-white"
    >
      {/* Scroll-Linked Parallax Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none parallax-bg">
        <Iridescence
          color={color || [0.06, 0.23, 0.44]}
          speed={0.8}
          amplitude={0.12}
          mouseReact={false}
        />
        <div className="absolute inset-0 bg-[#07090E]/40 backdrop-blur-[2px]" />
      </div>

      {/* Sticky Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#07090E]/80 backdrop-blur-[64px] border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">Campus Coin</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#showcase" className="hover:text-white transition-colors">
              Core Engine
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:flex items-center min-h-[44px] px-4 text-sm font-bold text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <MagneticButton
              to="/register"
              className="group flex items-center gap-2 min-h-[44px] bg-white hover:bg-white/95 text-slate-900 text-sm font-black py-2.5 px-6 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all"
            >
              Get Started{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 text-center pt-16 pb-20">
          <div className="hero-sub inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] backdrop-blur-[64px] border border-white/10 border-t-white/20 border-l-white/20 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Student Financial SaaS
            </span>
          </div>

          {/* Staggered Mask Headline */}
          <h1 className="text-[clamp(2.5rem,6vw,4.75rem)] font-black tracking-tight leading-[1.1] mb-8 text-white flex flex-wrap justify-center gap-x-3.5 gap-y-1">
            {headlineWords.map((word, idx) => (
              <span key={idx} className="overflow-hidden inline-block py-1">
                <span className="hero-word inline-block drop-shadow-sm">{word}</span>
              </span>
            ))}
          </h1>

          <p className="hero-sub text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Zero manual bank linking. Track daily spending, manage Khata peer debts, set monthly
            burn rate rings, and master student budgeting.
          </p>

          <div className="hero-sub flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton
              to="/register"
              className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 bg-white hover:bg-white/95 text-slate-900 text-base font-black py-3 px-8 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.25)] active:scale-95 transition-all"
            >
              Start Free Today <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <MagneticButton
              onClick={handleLaunchFreeDemo}
              className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-base font-bold py-3 px-8 rounded-full border border-white/20 backdrop-blur-[64px] active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Explore Live Demo
            </MagneticButton>
          </div>
          <div className="hero-sub mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Free Forever • Zero Setup Friction
          </div>
        </div>

        {/* Dashboard Spatial Preview Card */}
        <div className="max-w-6xl mx-auto px-6 mb-32 relative">
          <div
            className={`w-full ${glassCard} p-6 sm:p-8 overflow-hidden`}
            style={{ willChange: "transform, opacity" }}
          >
            {/* Mockup Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-white/50 font-mono ml-2">campuscoin.app/dashboard</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-emerald-300">
                Live Overview
              </div>
            </div>

            {/* Mockup Content Grid */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <span className="text-[11px] text-white/60 font-semibold uppercase">Total Balance</span>
                <div className="text-3xl font-black text-white mt-2">$1,465.00</div>
                <span className="text-emerald-400 text-xs font-bold mt-2 inline-block">+12.4% vs last month</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <span className="text-[11px] text-white/60 font-semibold uppercase">Monthly Burn</span>
                <div className="text-3xl font-black text-rose-300 mt-2">$535.00</div>
                <span className="text-sky-300 text-xs font-bold mt-2 inline-block">3 Active Caps</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <span className="text-[11px] text-white/60 font-semibold uppercase">Khata Position</span>
                <div className="text-3xl font-black text-emerald-300 mt-2">+$60.00</div>
                <span className="text-white/60 text-xs font-bold mt-2 inline-block">2 Pending Settlements</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid with GSAP ScrollTrigger Batch Reveal */}
        <div id="features" className="max-w-7xl mx-auto px-6 mb-36">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Engineered for Student Freedom.
            </h2>
            <p className="text-white/70 max-w-xl mx-auto text-base">
              Lightweight financial control built around erratic student stipends and volatile expenses.
            </p>
          </div>

          <div className="feature-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Khata Debt Tracker */}
            <div
              className={`feature-card ${glassCard} p-8 hover:bg-white/[0.06] transition-all`}
              style={{ willChange: "transform, opacity" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-400/30 text-emerald-400 shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Khata Peer Ledger</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Log who owes what from campus meals, transit splits, and project expenses. Interactive
                checkboxes toggle between pending warnings and cleared settlements.
              </p>
            </div>

            {/* Feature 2: Month-Ahead Budget Rings */}
            <div
              className={`feature-card ${glassCard} p-8 hover:bg-white/[0.06] transition-all`}
              style={{ willChange: "transform, opacity" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/20 flex items-center justify-center mb-6 border border-sky-400/30 text-sky-400 shadow-sm">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Advanced Budget Planning</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Configure monthly spending limits for the current month or plan ahead for next month.
                Visual progress rings alert you before student burn rates spike.
              </p>
            </div>

            {/* Feature 3: Cash vs Digital Receipts */}
            <div
              className={`feature-card ${glassCard} p-8 hover:bg-white/[0.06] transition-all`}
              style={{ willChange: "transform, opacity" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-400/30 text-purple-400 shadow-sm">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Payment Method Receipts</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Segregate Cash vs Digital Bank flows. Every transaction gets a unique human-readable
                ID with tap-to-copy receipts and dynamic category icons.
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Scroll Section (GSAP Pinning Engine) */}
        <div id="showcase" className="sticky-showcase-section max-w-7xl mx-auto px-6 mb-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Pinned Content */}
            <div className="sticky-showcase-left lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-sky-300">
                Core Architecture
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Designed to be felt, not just seen.
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                Experience ultra-fluid navigation and frictionless bookkeeping without bloated banking
                integrations or manual statement scraping.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-white/90 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Zero tab switching flashes & cached data rendering</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/90 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Physical spatial glass with crisp top-left edge lighting</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/90 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>100% white-labeled student financial SaaS</span>
                </div>
              </div>
            </div>

            {/* Right Scrolling Visual Cards */}
            <div className="lg:col-span-7 space-y-8">
              {/* Card 1: Khata Peer Ledger */}
              <div className={`${glassCard} p-7 space-y-4`} style={{ willChange: "transform, opacity" }}>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-sm">Khata Ledger</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Active Debt Ledger
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md border border-white/30 flex items-center justify-center text-white/40">
                        ⏳
                      </div>
                      <div>
                        <div className="font-bold text-white">Hamza Malik</div>
                        <div className="text-[10px] text-amber-300 font-bold">Pending / Not Paid</div>
                      </div>
                    </div>
                    <span className="font-black text-sm text-emerald-400">+$25.00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/30 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-white line-through opacity-70">Ayesha Khan</div>
                        <div className="text-[10px] text-emerald-400 font-bold">Paid & Settled</div>
                      </div>
                    </div>
                    <span className="font-black text-sm text-white/50 line-through">-$15.00</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Advanced Month Budget Rings */}
              <div className={`${glassCard} p-7 space-y-4`} style={{ willChange: "transform, opacity" }}>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white text-sm">Monthly Planning</span>
                  </div>
                  <div className="flex gap-1.5 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">Current</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 font-medium">Next Month</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>Campus Dining & Groceries</span>
                    <span className="text-sky-300">$145 / $400</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-400 h-2 rounded-full w-[36%]" />
                  </div>
                </div>
              </div>

              {/* Card 3: Dynamic Payment Methods */}
              <div className={`${glassCard} p-7 space-y-4`} style={{ willChange: "transform, opacity" }}>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-sm">Cash vs Digital Bank</span>
                  </div>
                  <span className="text-xs font-mono text-white/50">TXN-847291</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    <Banknote className="w-3.5 h-3.5" /> Cash Logged
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                    <CreditCard className="w-3.5 h-3.5" /> Digital Bank
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Plan / Demo CTA Section */}
        <div id="pricing" className="max-w-4xl mx-auto px-6 mb-28">
          <div className={`${glassCard} p-8 sm:p-14 text-center`} style={{ willChange: "transform, opacity" }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-6">
              100% Free Forever
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              Zero Subscription Charges.
            </h2>
            <p className="text-white/70 max-w-lg mx-auto mb-8 text-base leading-relaxed font-medium">
              No hidden fees, no credit card required. Launch the interactive demo or create your student account in 30 seconds.
            </p>

            <MagneticButton
              onClick={handleLaunchFreeDemo}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] bg-white hover:bg-white/95 text-slate-900 text-base font-black py-3 px-8 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
            >
              Launch Free Live Demo <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="max-w-4xl mx-auto px-6 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-white/70 text-sm">Everything you need to know about the platform.</p>
          </div>
          <div className="space-y-4">
            <div className={`${glassCard} p-6`} style={{ willChange: "transform, opacity" }}>
              <h3 className="text-base font-bold text-white mb-2">Is Campus Coin completely free for students?</h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                Yes, 100% free forever. Explore all ledger features, budgeting tools, and statements without paying a dime.
              </p>
            </div>
            <div className={`${glassCard} p-6`} style={{ willChange: "transform, opacity" }}>
              <h3 className="text-base font-bold text-white mb-2">Do I need to connect my bank account?</h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                Never. Campus Coin operates with zero manual bank linking, protecting your financial privacy.
              </p>
            </div>
            <div className={`${glassCard} p-6`} style={{ willChange: "transform, opacity" }}>
              <h3 className="text-base font-bold text-white mb-2">What is the Khata feature?</h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                Khata is a dedicated peer debt ledger to record who owes you money or who you owe money to, with one-tap status checkmarks.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#07090E]/90 backdrop-blur-[64px]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Coins className="w-5 h-5 text-white" />
            <span className="font-bold text-sm text-white">© 2026 Campus Coin. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-white/60 font-semibold">
            <a href="#" className="hover:text-white transition-colors min-h-[44px] flex items-center">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors min-h-[44px] flex items-center">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors min-h-[44px] flex items-center">
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
