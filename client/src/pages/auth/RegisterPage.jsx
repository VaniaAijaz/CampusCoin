import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import api from "../../core/api";
import toast from "react-hot-toast";

const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Other"];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    academicYear: "1st Year",
    monthlyAllowanceBaseline: "",
    monthlySavingsGoal: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        academicYear: form.academicYear,
        monthlyAllowanceBaseline: form.monthlyAllowanceBaseline ? parseFloat(form.monthlyAllowanceBaseline) : 0,
        monthlySavingsGoal: form.monthlySavingsGoal ? parseFloat(form.monthlySavingsGoal) : 0,
      };
      const { data } = await api.post("/auth/register", payload);
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome to Campus Coin, ${data.user.name}!`);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:border-white/20">
      <div className="mb-6 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
          <span>Create Account</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-mint/20 text-emerald-300 border border-brand-mint/30">
            Free
          </span>
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Set up your smart student budget tracker in 30 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Alex Morgan"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {errors.name && <p className="text-xs text-brand-coral mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Campus Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="student@university.edu"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          {errors.email && <p className="text-xs text-brand-coral mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Academic Year
            </label>
            <select
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y} className="bg-brand-obsidian">{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Monthly Allowance ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 350"
              value={form.monthlyAllowanceBaseline}
              onChange={(e) => setForm({ ...form, monthlyAllowanceBaseline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-brand-coral mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {errors.confirmPassword && <p className="text-xs text-brand-coral mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-brand-primary to-brand-ai hover:from-brand-primary hover:to-violet-700 text-white font-medium text-sm shadow-lg shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? "Registering Account..." : "Create Free Account"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-400">
        Already have a student account?{" "}
        <Link to="/login" className="text-brand-primary hover:text-brand-primary/80 font-semibold transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
