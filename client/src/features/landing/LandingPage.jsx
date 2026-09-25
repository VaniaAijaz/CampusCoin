import { Link } from "react-router-dom";
import { Coins, Sparkles, Brain, Target, FileText, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050914] text-white font-sans overflow-x-hidden selection:bg-brand-primary/30">
      {/* Global Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-fixed bg-center opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050914]/80 via-[#050914]/90 to-[#050914]" />
      </div>

      {/* Sticky Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
              <Coins className="w-5 h-5 text-brand-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Campus Coin</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/register" className="group flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold py-2.5 px-6 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
              Get started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 text-center pt-16 pb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span className="text-sm font-medium text-zinc-200">✨ Made for Student Life</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Campus Coin.<br className="hidden md:block" /> Your money, finally making sense.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Track the everyday, plan for what matters, and make the most of student life. Zero bank syncing required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white text-base font-semibold py-3.5 px-8 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login?demo=student" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-base font-semibold py-3.5 px-8 rounded-full border border-white/20 backdrop-blur-md transition-all shadow-md active:scale-95">
              Explore the demo
            </Link>
          </div>
        </div>

        {/* Dashboard Preview (The Hook) */}
        <div className="max-w-6xl mx-auto px-6 mb-32 relative perspective-[2000px]">
          <div 
            className="w-full h-[600px] rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
            style={{ 
              transform: "rotateX(15deg) scale(0.95)",
              transformOrigin: "top center",
              maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)"
            }}
          >
            {/* Mockup Top Bar */}
            <div className="h-14 border-b border-white/10 flex items-center px-6 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-black/40 rounded-md h-7 border border-white/5" />
            </div>
            
            {/* Mockup Dashboard Content */}
            <div className="p-8 grid grid-cols-3 gap-6 h-full opacity-80 pointer-events-none">
              <div className="col-span-2 space-y-6">
                <div className="h-40 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-transparent border border-white/5" />
                <div className="h-64 rounded-2xl bg-white/5 border border-white/5" />
              </div>
              <div className="space-y-6">
                <div className="h-28 rounded-2xl bg-white/5 border border-white/5" />
                <div className="h-28 rounded-2xl bg-white/5 border border-white/5" />
                <div className="h-40 rounded-2xl bg-white/5 border border-white/5" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="max-w-7xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, in one place.</h2>
            <p className="text-zinc-400">Powerful tools designed specifically for the student economy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Insights */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <Brain className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Insights</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our Gemini-backed AI continuously scans your spending to give you ultra-personalized, bite-sized financial advice that actually makes sense.
              </p>
            </div>

            {/* Budgets */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Target className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gamified Budgets</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Set category limits, track your progress via stunning glass progress rings, and get rewarded for keeping your monthly burn rate low.
              </p>
            </div>

            {/* PDF Statements */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <FileText className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant PDF Statements</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Generate professional, bank-grade PDF statements instantly directly in your browser. Perfect for proving expenses or sharing with parents.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Minimalist Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-60">
            <Coins className="w-5 h-5" />
            <span className="font-semibold text-sm">© 2026 Campus Coin. Built for Techwiz 7.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
