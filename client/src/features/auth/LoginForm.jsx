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



  return (
    <div className="w-full bg-white/10 backdrop-blur-[40px] backdrop-saturate-[150%] border border-white/30 rounded-[32px] p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] text-white">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
          <span>Sign In</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-sky-300">
            Student Edition
          </span>
        </h2>
        <p className="text-xs text-white/70 mt-1">
          Enter your student credentials.
        </p>
      </div>



      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setErrors({ ...errors, email: "" });
            }}
            placeholder="student@campuscoin.pk"
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-full bg-white/10 border border-white/25 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-white/50 transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-rose-300 mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-sky-300 hover:underline transition-colors"
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
              className="w-full px-4 py-2.5 pr-10 rounded-full bg-white/10 border border-white/25 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-white/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-300 mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 py-3 px-5 rounded-full bg-white/25 hover:bg-white/35 border border-white/40 text-white font-bold text-xs tracking-wide shadow-[0_8px_32px_0_rgba(0,0,0,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? "Authenticating..." : "Sign In to Campus Coin"}
        </button>
      </form>
    </div>
  );
}
