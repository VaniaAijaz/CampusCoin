import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Lock, PiggyBank, GraduationCap, DollarSign,
  Save, LogOut, Check, ChevronDown, Moon, Sun, Palette,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../core/api";
import toast from "react-hot-toast";
import "../dashboard/Dashboard.css";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { toggleMode, isDark, themes, themeId, selectTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currencies = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "PKR", label: "PKR (Rs)" },
  ];

  const handleCurrencyChange = async (val) => {
    setCurrencyDropdownOpen(false);
    if (form.currency === val) return;
    setForm(p => ({ ...p, currency: val }));
    try {
      const { data } = await api.put("/users/profile/currency", { currency_preference: val });
      if (data.success) {
        updateUser(data.user);
        queryClient.invalidateQueries();
        toast.success(`Currency changed to ${val}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update currency.");
      setForm(p => ({ ...p, currency: user?.currency || "USD" }));
    }
  };

  const [form, setForm] = useState({
    name: user?.name || "",
    academicYear: user?.academicYear || "",
    monthlyAllowanceBaseline: user?.monthlyAllowanceBaseline || 0,
    monthlySavingsGoal: user?.monthlySavingsGoal || 0,
    currency: user?.currency || "USD",
  });

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
        toast.success("Profile updated!");
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
      toast.error("Passwords do not match.");
      return;
    }
    setChangingPass(true);
    try {
      const { data } = await api.put("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (data.success) {
        toast.success("Password updated!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="dash-root" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* ── PAGE HEADER ── */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Profile & Settings</h1>
          <p className="dash-page-desc">Manage your account information, budget goals, and preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "start" }}>
        {/* ── LEFT: Identity & Preferences Card ── */}
        <div className="dash-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          {/* Avatar */}
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "22px",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 900,
              color: "#ffffff",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.3)",
              marginBottom: "14px",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--dash-foreground)", margin: "0 0 4px" }}>
            {user?.name}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--dash-muted)", margin: "0 0 12px" }}>
            {user?.email}
          </p>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "4px 12px",
              borderRadius: "9999px",
              background: user?.role === "admin" ? "var(--dash-purple-soft)" : "var(--dash-blue-soft)",
              color: user?.role === "admin" ? "var(--dash-purple)" : "var(--dash-blue)",
            }}
          >
            {user?.role === "admin" ? "Campus Admin" : "Student Account"}
          </span>

          {/* Quick Details */}
          <div style={{
            width: "100%",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--dash-border)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {[
              { label: "Academic Year", value: user?.academicYear || "Not set" },
              { label: "Monthly Allowance", value: `$${user?.monthlyAllowanceBaseline || 0}` },
              { label: "Savings Goal", value: `$${user?.monthlySavingsGoal || 0}` },
              { label: "Preferred Currency", value: user?.currency || "USD" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                <span style={{ color: "var(--dash-muted)", fontWeight: 500 }}>{r.label}</span>
                <span style={{ color: "var(--dash-foreground)", fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Theme & Appearance */}
          <div style={{
            width: "100%",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--dash-border)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12.5px", color: "var(--dash-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                {isDark ? <Moon size={14} /> : <Sun size={14} />} Appearance
              </span>
              <button
                type="button"
                onClick={toggleMode}
                className="dash-btn-secondary"
                style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}
              >
                {isDark ? "Dark Mode" : "Light Mode"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12.5px", color: "var(--dash-muted)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                <Palette size={14} /> Accent
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {themes.map(th => {
                  const bgSwatch = th.swatch || (th.color ? `rgb(${Math.round(th.color[0]*255)},${Math.round(th.color[1]*255)},${Math.round(th.color[2]*255)})` : "#3B82F6");
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => selectTheme(th.id)}
                      title={th.name}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        border: themeId === th.id ? "2px solid #0f172a" : "2px solid #e2e8f0",
                        background: bgSwatch,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: themeId === th.id ? "scale(1.15)" : "scale(1)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {themeId === th.id && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={async () => {
              try { await api.post("/users/logout-session"); } catch (_) {}
              logout();
              navigate("/login");
            }}
            className="dash-btn-secondary"
            style={{ width: "100%", marginTop: "20px", color: "var(--dash-danger)", borderColor: "#fee2e2" }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* ── RIGHT: Personal Info & Security Forms ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Personal Information Form */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Personal Information</h3>
                <p className="dash-card-subtitle">Update your profile details and campus allowances</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div>
                  <label className="dash-form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    className="dash-input"
                  />
                </div>

                <div>
                  <label className="dash-form-label">Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. Sophomore, Year 2"
                    value={form.academicYear}
                    onChange={(e) => setForm(p => ({ ...p, academicYear: e.target.value }))}
                    className="dash-input"
                  />
                </div>

                <div>
                  <label className="dash-form-label">Monthly Allowance ($)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    placeholder="0"
                    value={form.monthlyAllowanceBaseline}
                    onChange={(e) => setForm(p => ({ ...p, monthlyAllowanceBaseline: Number(e.target.value) }))}
                    className="dash-input"
                  />
                </div>

                <div>
                  <label className="dash-form-label">Monthly Savings Goal ($)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    placeholder="0"
                    value={form.monthlySavingsGoal}
                    onChange={(e) => setForm(p => ({ ...p, monthlySavingsGoal: Number(e.target.value) }))}
                    className="dash-input"
                  />
                </div>
              </div>

              {/* Currency Selector */}
              <div ref={currencyRef} style={{ position: "relative" }}>
                <label className="dash-form-label">Currency</label>
                <button
                  type="button"
                  onClick={() => setCurrencyDropdownOpen(o => !o)}
                  className="dash-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>{currencies.find(c => c.value === form.currency)?.label || "Select Currency"}</span>
                  <ChevronDown size={15} color="var(--dash-muted)" />
                </button>
                {currencyDropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: "#ffffff",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    zIndex: 50,
                    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                  }}>
                    {currencies.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleCurrencyChange(c.value)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: "13px",
                          fontWeight: form.currency === c.value ? 700 : 500,
                          color: form.currency === c.value ? "var(--dash-blue)" : "var(--dash-foreground)",
                          background: form.currency === c.value ? "var(--dash-blue-soft)" : "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--dash-font)",
                          transition: "background 0.1s ease",
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="dash-btn-primary"
                  style={{ marginTop: "4px" }}
                >
                  <Save size={15} />
                  <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Form */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">Security & Password</h3>
                <p className="dash-card-subtitle">Change your password to keep your account safe</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                <div>
                  <label className="dash-form-label">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                    className="dash-input"
                  />
                </div>

                <div>
                  <label className="dash-form-label">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                    className="dash-input"
                  />
                </div>

                <div>
                  <label className="dash-form-label">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="dash-input"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="dash-btn-secondary"
                  style={{ marginTop: "4px" }}
                >
                  <Lock size={14} />
                  <span>{changingPass ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
