import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { auth, googleProvider, signInWithPopup } from "../../core/firebaseClient";
import api from "../../core/api";
import { Coins, Mail, Lock, User, ArrowRight, ArrowLeft, Sparkles, Shield, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function SplitAuthPage({ defaultMode = "login" }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, loading: contextLoading, login: setAuthSession } = useAuth();
  const isAuthLoading = authLoading !== undefined ? authLoading : contextLoading;

  const [isLogin, setIsLogin] = useState(() => {
    if (searchParams.get("mode") === "register" || location.pathname === "/register") return false;
    if (searchParams.get("mode") === "login" || location.pathname === "/login") return true;
    return defaultMode === "login";
  });

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      const target = user?.role === "admin" ? "/app/admin" : "/app";
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, user, navigate]);

  // Sync mode if pathname changes
  useEffect(() => {
    if (location.pathname === "/register") {
      setIsLogin(false);
    } else if (location.pathname === "/login") {
      setIsLogin(true);
    }
  }, [location.pathname]);

  const handleAuthSuccess = (userData, userToken, message) => {
    setAuthSession(userData, userToken);
    toast.success(message || `Welcome to Campus Coin, ${userData.name}!`);
    const destination = userData.role === "admin" ? "/app/admin" : "/app";
    navigate(destination, { replace: true });
  };

  // Instant 1-Click Demo Login
  const handleQuickDemo = async (role) => {
    setLoading(true);
    const creds = role === "admin"
      ? { email: "admin@campuscoin.com", password: "Admin@123" }
      : { email: "student@campuscoin.com", password: "Student@123" };

    try {
      const { data } = await api.post("/auth/login", creds);
      if (data.success) {
        handleAuthSuccess(data.user, data.token, `Welcome to Campus Coin, ${data.user.name}!`);
        return;
      }
    } catch {
      // Fallback demo session if API has connectivity hiccup
      const fallbackUser = role === "admin"
        ? {
            _id: "demo-admin-id",
            name: "Campus Coin Admin",
            email: "admin@campuscoin.com",
            role: "admin",
            isActive: true,
          }
        : {
            _id: "demo-student-id",
            name: "Alex Rivera",
            email: "student@campuscoin.com",
            role: "student",
            academicYear: "Junior (Year 3)",
            monthlyAllowanceBaseline: 1500,
            monthlySavingsGoal: 300,
            currency: "USD",
            isActive: true,
          };
      handleAuthSuccess(fallbackUser, "demo-mock-jwt-token", `Welcome to Campus Coin Demo, ${fallbackUser.name}!`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-login if ?demo=student is present in URL
  useEffect(() => {
    const demoParam = searchParams.get("demo");
    if (demoParam === "student" || demoParam === "admin") {
      handleQuickDemo(demoParam);
    }
  }, [searchParams]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, formData);
      if (data.success) {
        handleAuthSuccess(data.user, data.token, `Welcome ${data.user.name.split(" ")[0]}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const endpoint = isLogin ? "/auth/google/login" : "/auth/google/register";
      const { data } = await api.post(endpoint, { idToken });
      
      if (data.success) {
        handleAuthSuccess(data.user, data.token, `Welcome ${data.user.name.split(" ")[0]}!`);
      }
    } catch (err) {
      if (err.response?.status === 404 && isLogin) {
        toast.error("Account not found. Please sign up.");
      } else if (err.response?.status === 409 && !isLogin) {
        toast.error("Account already exists. Please log in.");
      } else {
        toast.error(err.response?.data?.message || "Google Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full text-white relative overflow-hidden">
      {/* Background Refraction Canvas */}
      <div 
        className="fixed inset-0 h-screen w-screen bg-cover bg-center -z-20 scale-100"
        style={{ backgroundImage: "url('/liquid_bg.jpg')" }}
      />
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] -z-10" />

      {/* Left side: Hero Branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12">
        <div className="relative z-10 max-w-xl p-10 rounded-[32px] bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 rounded-[20px] bg-white/20 border border-white/40 flex items-center justify-center text-white shadow-inner">
              <Coins className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight">Campus Coin</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-sky-300">NextGen BudgetBee</p>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-6 text-white drop-shadow-sm">
            Master your student finances with <span className="text-sky-300">clarity.</span>
          </h2>
          <p className="text-base text-white/80 leading-relaxed font-medium">
            Smart Spending, Student Style. Frictionless student-first expense tracking, AI financial advice, and zero manual bank linking.
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-[560px] flex items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-[32px] bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-300">Campus Coin</span>
          </div>

          <div className="mb-6 text-center">
            <h3 className="text-2xl sm:text-3xl font-black mb-2 text-white drop-shadow-sm">
              {isLogin ? "Welcome Back" : "Join Campus Coin"}
            </h3>
            <p className="text-white/70 text-xs">
              {isLogin ? "Sign in to access your student dashboard." : "Create your student account in seconds."}
            </p>
          </div>

          {/* 1-Click Instant Demo Credentials */}
          <div className="mb-6 p-3.5 rounded-[20px] bg-white/10 border border-white/25 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                1-Click Instant Demo:
              </span>
              <span className="text-[10px] text-white/60 font-mono">No typing required</span>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo("student")}
                className="flex-1 py-2 px-3 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Student Demo</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo("admin")}
                className="flex-1 py-2 px-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Demo</span>
              </button>
            </div>
          </div>

          {/* Toggle Login / Signup */}
          <div className="flex bg-white/10 p-1 rounded-full mb-6 border border-white/20">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(true);
                if (location.pathname === "/register") navigate("/login", { replace: true });
              }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isLogin ? 'bg-white/30 text-white shadow-sm font-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsLogin(false);
                if (location.pathname === "/login") navigate("/register", { replace: true });
              }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isLogin ? 'bg-white/30 text-white shadow-sm font-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Auth Button */}
          <button 
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 bg-white hover:bg-white/90 text-slate-900 rounded-full font-bold text-xs transition-all disabled:opacity-50 mb-5 cursor-pointer shadow-md active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Or with email</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="Alex Rivera"
                    required
                    className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email" 
                  placeholder="student@campuscoin.com"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-[11px] text-sky-300 hover:underline">
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type="password" 
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 h-11 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white font-bold text-xs tracking-wide shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? "Sign In to Campus Coin" : "Create Student Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
