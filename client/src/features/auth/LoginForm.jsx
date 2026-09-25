import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Sparkles, Shield, UserCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "../../core/api";
import toast from "react-hot-toast";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email.";
    if (!form.password) errs.password = "Password is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate(data.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role) => {
    if (role === "admin") {
      setForm({ email: "admin@campuscoin.com", password: "Admin@123" });
    } else {
      setForm({ email: "student@campus.edu", password: "Password123" });
    }
    setErrors({});
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-white/20">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
          <span>Sign In</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary text-brand-dark/20 text-brand-primary/80 border border-brand-primary/30">
            Student Edition
          </span>
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Enter your student credentials or use a quick demo role to begin.
        </p>
      </div>

      {/* Demo Credentials Quick Fill Pills */}
      <div className="mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Quick Demo Login:
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleQuickDemo("student")}
            className="flex-1 sm:flex-initial text-xs px-2.5 py-1 rounded-lg bg-brand-primary text-brand-dark/30 hover:bg-brand-primary text-brand-dark/50 text-indigo-200 border border-brand-primary/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <UserCheck className="w-3 h-3" /> Student
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("admin")}
            className="flex-1 sm:flex-initial text-xs px-2.5 py-1 rounded-lg bg-brand-mint/30 hover:bg-brand-mint/50 text-emerald-200 border border-brand-mint/30 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Shield className="w-3 h-3" /> Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setErrors({ ...errors, email: "" });
            }}
            placeholder="student@university.edu"
            autoComplete="email"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-black/40 border ${
              errors.email ? "border-brand-coral/70 text-rose-200" : "border-white/10 text-white"
            } placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-brand-primary/50 transition-all`}
          />
          {errors.email && (
            <p className="text-xs text-brand-coral mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setErrors({ ...errors, password: "" });
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/40 border ${
                errors.password ? "border-brand-coral/70 text-rose-200" : "border-white/10 text-white"
              } placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-brand-primary/50 transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-brand-coral mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white font-medium text-sm shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? "Authenticating..." : "Sign In to Campus Coin"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-400">
        Don't have a student account yet?{" "}
        <Link to="/register" className="text-brand-primary hover:text-brand-primary/80 font-semibold transition-colors">
          Create one free
        </Link>
      </div>
    </div>
  );
}
