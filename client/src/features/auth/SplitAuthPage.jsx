import { useState } from "react";
import { useAuth } from "./AuthContext";
import { auth, googleProvider, signInWithPopup } from "../../core/firebaseClient";
import api from "../../core/api";
import { Coins, Mail, Lock, User, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function SplitAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login: setAuthSession } = useAuth();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, formData);
      if (data.success) {
        setAuthSession(data.user, data.token);
        toast.success(`Welcome ${data.user.name.split(" ")[0]}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed");
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
        setAuthSession(data.user, data.token);
        toast.success(`Welcome ${data.user.name.split(" ")[0]}!`);
      }
    } catch (err) {
      if (err.response?.status === 404 && isLogin) {
        toast.error("User didn't exist. You may have to sign up.");
      } else if (err.response?.status === 409 && !isLogin) {
        toast.error("Account already exists. Please log in.");
      } else {
        toast.error(err.response?.data?.message || "Google Authentication failed. Are your API keys set?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#0B0F19] text-slate-100">
      {/* Left side: Hero Branding */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-[#0E1322] border-r border-slate-800">
        <div className="relative z-10 p-12 max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Coins className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Campus Coin</h1>
          </div>
          <h2 className="text-5xl font-black leading-tight mb-6 text-white">
            Master your student finances with <span className="text-blue-400">precision.</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            A lightweight, student-first budgeting SaaS designed for university life with zero manual bank linking.
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-[600px] flex items-center justify-center p-8 relative auth-form-container bg-[#0B0F19]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-3xl font-black mb-2 text-white">{isLogin ? "Welcome back" : "Create an account"}</h3>
            <p className="text-slate-400 text-sm">
              {isLogin ? "Enter your details to access your dashboard." : "Join Campus Coin and take control."}
            </p>
          </div>

          <div className="flex bg-[#0E1322] p-1.5 rounded-xl mb-6 border border-slate-800">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${!isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 bg-white hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-xs transition-all disabled:opacity-50 mb-6 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-3xs text-slate-500 font-bold uppercase tracking-wider">Or continue with email</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {isLogin && (
            <div className="mb-4 p-3 rounded-2xl bg-[#111726] border border-slate-800 flex flex-col gap-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Credentials
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      name: "",
                      email: "admin@campuscoin.com",
                      password: "Admin@123",
                    })
                  }
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-2xs font-bold text-blue-200 transition-all text-center"
                >
                  👑 Admin Demo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      name: "",
                      email: "student@campuscoin.com",
                      password: "Student@123",
                    })
                  }
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-2xs font-bold text-emerald-200 transition-all text-center"
                >
                  🎓 Student Demo
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="John Doe"
                    required
                    className="glass-input pl-12"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email" 
                  placeholder="student@university.edu"
                  required
                  className="glass-input pl-12"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-zinc-400">Password</label>
                {isLogin && <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type="password" 
                  placeholder="••••••••"
                  required
                  className="glass-input pl-12"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="glass-btn-primary w-full mt-4 h-12 text-base"
            >
              {isLogin ? "Log In" : "Sign Up"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
