import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { motion } from "framer-motion";
import { Coins, Sparkles, Brain, Target, FileText, ArrowRight } from "lucide-react";
import Iridescence from "../../components/ui/Iridescence";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../auth/AuthContext";

/** Magnetic hover — button gently pulls toward cursor with 44px min height */
function MagneticButton({ children, className, to, href, onClick }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
    el.style.transform = `translate(${x}px,${y}px)`;
  };
  const handleLeave = () => { if (ref.current) ref.current.style.transform = "translate(0,0)"; };
  const style = { transition: "transform 0.3s cubic-bezier(.22,1,.36,1)" };
  if (to) return (
    <Link to={to} ref={ref} className={className} style={style} onClick={onClick}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>{children}</Link>
  );
  if (onClick) return (
    <button type="button" ref={ref} className={className} style={style} onClick={onClick}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>{children}</button>
  );
  return (
    <a href={href} ref={ref} className={className} style={style} onClick={onClick}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>{children}</a>
  );
}

export default function LandingPage() {
  const { color } = useTheme();
  const navigate = useNavigate();
  const { enterDemoMode } = useAuth();

  const handleLaunchFreeDemo = () => {
    enterDemoMode("student");
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-[#050914] text-white font-sans overflow-x-hidden selection:bg-brand-primary/30">
      {/* Global Background — Iridescence */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Iridescence color={color || [0.06, 0.23, 0.44]} speed={0.8} amplitude={0.12} mouseReact={false} />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Sticky Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border-b border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[14px] bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-md">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Campus Coin</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:flex items-center min-h-[44px] px-3 text-sm font-medium text-white/80 hover:text-white transition-colors">
              Log in
            </Link>
            <MagneticButton to="/register" className="group flex items-center gap-2 min-h-[44px] bg-white hover:bg-white/95 text-slate-900 text-sm font-bold py-2.5 px-6 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.2)] active:scale-95 transition-all">
              Get started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 text-center pt-16 pb-20">
          <div className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-full bg-white/10 border border-white/20 backdrop-blur-[64px] mb-8">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-semibold text-white/90">Made for Student Life</span>
          </div>
          
          <h1 className="text-[clamp(2.5rem,6vw,4.75rem)] font-black tracking-tight leading-tight mb-8">
            Campus Coin.<br className="hidden md:block" /> Your money, finally making sense.
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            Track everyday spending, plan for what matters, and master university finances without manual bank linking.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton to="/register" className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 bg-white hover:bg-white/95 text-slate-900 text-base font-bold py-3 px-8 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.25)] active:scale-95 transition-all">
              Get started <ArrowRight className="w-4 h-4" />
            </MagneticButton>
            <MagneticButton
              onClick={handleLaunchFreeDemo}
              className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-base font-semibold py-3 px-8 rounded-full border border-white/30 backdrop-blur-[64px] active:scale-95 transition-all cursor-pointer"
            >
              Explore Free Demo
            </MagneticButton>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Free Forever • No Credit Card Required
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-6xl mx-auto px-6 mb-32 relative perspective-[2000px]">
          <div 
            className="w-full h-[540px] rounded-[32px] bg-white/10 border border-white/30 backdrop-blur-[64px] backdrop-saturate-[150%] shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden"
            style={{ 
              transform: "rotateX(12deg) scale(0.96)",
              transformOrigin: "top center",
              maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)"
            }}
          >
            {/* Mockup Top Bar */}
            <div className="h-14 border-b border-white/15 flex items-center px-6 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-white/10 rounded-full h-7 border border-white/15" />
            </div>
            
            {/* Mockup Dashboard Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 h-full opacity-85 pointer-events-none">
              <div className="md:col-span-2 space-y-6">
                <div className="h-36 rounded-[24px] bg-white/10 border border-white/15" />
                <div className="h-56 rounded-[24px] bg-white/10 border border-white/15" />
              </div>
              <div className="space-y-6">
                <div className="h-28 rounded-[24px] bg-white/10 border border-white/15" />
                <div className="h-28 rounded-[24px] bg-white/10 border border-white/15" />
                <div className="h-36 rounded-[24px] bg-white/10 border border-white/15" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="max-w-7xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, in one place.</h2>
            <p className="text-white/60">Modern financial tools designed specifically for students.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Insights */}
            <div className="bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-[32px] p-8 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-[16px] bg-violet-500/25 flex items-center justify-center mb-6 border border-violet-400/40 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                <Brain className="w-7 h-7 text-violet-300" />
              </div>
              <h3 className="text-xl font-bold mb-3">Automated Insights</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Smart analytics scan your spending patterns to deliver hyper-relevant, bite-sized recommendations to stretch your budget.
              </p>
            </div>

            {/* Budgets */}
            <div className="bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-[32px] p-8 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-[16px] bg-sky-500/25 flex items-center justify-center mb-6 border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                <Target className="w-7 h-7 text-sky-300" />
              </div>
              <h3 className="text-xl font-bold mb-3">Adaptive Budgets</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Set category caps, track progress with frosted glass indicators, and stay on top of monthly burn rates effortlessly.
              </p>
            </div>

            {/* PDF Statements */}
            <div className="bg-white/10 backdrop-blur-[64px] backdrop-saturate-[150%] border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-[32px] p-8 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 rounded-[16px] bg-emerald-500/25 flex items-center justify-center mb-6 border border-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.25)]">
                <FileText className="w-7 h-7 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Statements</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Generate clean, exportable PDF statements right inside the app to track records or share expense summaries.
              </p>
            </div>
          </div>
        </div>

        {/* 100% Free Plan Section */}
        <div id="pricing" className="max-w-4xl mx-auto px-6 mb-24">
          <div className="rounded-[32px] bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-[64px] backdrop-saturate-[200%] border border-white/20 border-b-white/5 border-r-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_32px_0_rgba(0,0,0,0.15)] p-8 sm:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
              100% Free Forever
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Completely Free for Every Student.
            </h2>
            <p className="text-white/70 max-w-lg mx-auto mb-8 text-sm sm:text-base leading-relaxed">
              No subscription charges. No premium paywalls. Try the fully functional live demo right now with zero setup.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left mb-8 text-xs sm:text-sm text-white/80 font-medium">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">✓</span>
                Full Dashboard & Analytics
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">✓</span>
                AI Spending Insights
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">✓</span>
                Unlimited Budget Caps
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-bold">✓</span>
                Zero Bank Linking Fees
              </div>
            </div>

            <MagneticButton
              onClick={handleLaunchFreeDemo}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] bg-white hover:bg-white/95 text-slate-900 text-base font-bold py-3 px-8 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
            >
              Launch Completely Free Demo <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="max-w-4xl mx-auto px-6 mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-white">Frequently Asked Questions</h2>
            <p className="text-white/60 text-sm">Everything you need to know about our free student platform.</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-[64px] border border-white/20 p-6">
              <h3 className="text-base font-bold text-white mb-2">Is the Campus Coin demo completely free?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Yes, 100% completely free. You can explore the full student or admin demo with a single click—no registration, payment details, or commitments required.
              </p>
            </div>
            <div className="rounded-[24px] bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-[64px] border border-white/20 p-6">
              <h3 className="text-base font-bold text-white mb-2">Are there any hidden subscription costs or paywalls?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Zero. Campus Coin is built specifically for students. All core features including expense tracking, budget limits, automated insights, and statement exports are free forever.
              </p>
            </div>
            <div className="rounded-[24px] bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-[64px] border border-white/20 p-6">
              <h3 className="text-base font-bold text-white mb-2">Do I need to link a bank account or credit card?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Never. Campus Coin requires zero bank linking. You have total privacy and complete control over your financial records.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimalist White-Labeled Footer */}
      <footer className="relative z-10 border-t border-white/15 bg-black/40 backdrop-blur-[64px]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <Coins className="w-5 h-5 text-white" />
            <span className="font-semibold text-sm text-white">© 2026 Campus Coin. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors min-h-[44px] flex items-center">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors min-h-[44px] flex items-center">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors min-h-[44px] flex items-center">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
