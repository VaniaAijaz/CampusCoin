import { useState, useEffect } from "react";
import { User, Lock, PiggyBank, GraduationCap, DollarSign, Save } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import api from "../../core/api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    academicYear: user?.academicYear || "",
    monthlyAllowanceBaseline: user?.monthlyAllowanceBaseline || 0,
    monthlySavingsGoal: user?.monthlySavingsGoal || 0,
    currency: user?.currency || "USD",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        academicYear: user.academicYear || "",
        monthlyAllowanceBaseline: user.monthlyAllowanceBaseline || 0,
        monthlySavingsGoal: user.monthlySavingsGoal || 0,
        currency: user.currency || "USD",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      if (data.success) {
        updateUser(data.user);
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPass(true);
    try {
      const { data } = await api.put("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (data.success) {
        toast.success("Password updated successfully!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-brand-primary" />
          Student Account & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Configure personal baseline allowances, savings targets, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-primary via-brand-primary to-brand-ai flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-primary/30 mb-4">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-zinc-400">{user?.email}</p>
            <span className="mt-2 text-3xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-brand-primary text-brand-dark/20 text-brand-primary/80 border border-brand-primary/30">
              {user?.role === "admin" ? "Campus Admin" : "Active Student"}
            </span>
          </div>

          <div className="w-full mt-6 pt-4 border-t border-white/5 space-y-2 text-xs text-left">
            <div className="flex justify-between text-zinc-400">
              <span>Academic Year:</span>
              <span className="text-white font-medium">{user?.academicYear || "Unspecified"}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Baseline Allowance:</span>
              <span className="text-brand-mint font-semibold">${user?.monthlyAllowanceBaseline || 0}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Savings Goal:</span>
              <span className="text-brand-primary font-semibold">${user?.monthlySavingsGoal || 0}</span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h3 className="text-base font-bold text-white pb-3 border-b border-white/10 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-primary" />
              Academic & Financial Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Academic Year</label>
                <input
                  type="text"
                  placeholder="e.g. Sophomore, Year 2"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                  Monthly Baseline Allowance ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={form.monthlyAllowanceBaseline}
                  onChange={(e) => setForm({ ...form, monthlyAllowanceBaseline: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                  <PiggyBank className="w-3.5 h-3.5 text-zinc-400" />
                  Monthly Savings Goal ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={form.monthlySavingsGoal}
                  onChange={(e) => setForm({ ...form, monthlySavingsGoal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="py-2 px-4 rounded-xl bg-brand-primary text-brand-dark hover:bg-brand-primary text-brand-dark text-xs font-semibold shadow-md shadow-brand-primary/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProfile ? "Saving..." : "Save Preferences"}</span>
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="pt-6 border-t border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-primary" />
              Security & Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-white text-xs"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPass}
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{changingPass ? "Updating Password..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
