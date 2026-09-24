import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Lock, Sun, Moon, Type, Upload,
  Save, LogOut, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import Papa from "papaparse";

const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Masters", "PhD", "Other"];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || "",
    academicYear: user?.academicYear || "",
    monthlyAllowanceBaseline: user?.monthlyAllowanceBaseline || "",
    monthlySavingsGoal: user?.monthlySavingsGoal || "",
    currency: user?.currency || "USD",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false });

  // CSV import
  const [importing, setImporting] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error("Name is required."); return; }
    setProfileSaving(true);
    try {
      const payload = {
        ...profile,
        monthlyAllowanceBaseline: profile.monthlyAllowanceBaseline ? parseFloat(profile.monthlyAllowanceBaseline) : 0,
        monthlySavingsGoal: profile.monthlySavingsGoal ? parseFloat(profile.monthlySavingsGoal) : 0,
        theme,
        fontSize,
      };
      const { data } = await api.put("/auth/profile", payload);
      updateUser(data.user);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally { setProfileSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error("All password fields required."); return; }
    if (pwForm.newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords do not match."); return; }
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed.");
    } finally { setPwSaving(false); }
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          const rows = result.data.map(r => ({
            date: r.date || r.Date,
            description: r.description || r.Description || "",
            amount: r.amount || r.Amount,
            type: (r.type || r.Type || "expense").toLowerCase(),
            categoryName: r.category || r.Category || "Miscellaneous",
          }));
          const { data } = await api.post("/transactions/import-csv", { rows });
          toast.success(`Imported ${data.imported} transactions. ${data.skipped} skipped.`);
        } catch (err) {
          toast.error(err.response?.data?.message || "Import failed.");
        } finally {
          setImporting(false);
        }
      },
    });
    e.target.value = "";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const setP = (k) => (e) => setProfile(f => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwForm(f => ({ ...f, [k]: e.target.value }));

  const TABS = [
    { id: "profile",    label: "Profile",   icon: User  },
    { id: "security",   label: "Security",  icon: Lock  },
    { id: "appearance", label: "Appearance",icon: Sun   },
    { id: "data",       label: "Data",      icon: Upload},
  ];

  return (
    <div className="page-content">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, security, and preferences."
      />

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
        {/* Sidebar nav */}
        <div className="cc-card" style={{ padding: "12px", alignSelf: "flex-start", position: "sticky", top: "calc(var(--spacing-header) + 24px)" }}>
          {/* User card */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px 16px", borderBottom: "1px solid var(--color-border)", marginBottom: 8, gap: 8 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 20, cursor: "default" }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-dark)" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-subtle)" }}>{user?.email}</div>
              {user?.role === "admin" && (
                <span className="cc-badge cc-badge-info" style={{ marginTop: 4 }}>Admin</span>
              )}
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`nav-item${tab === t.id ? " active" : ""}`}
                style={{ width: "100%", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13 }}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
            <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />
            <button
              onClick={handleLogout}
              className="nav-item"
              style={{ width: "100%", border: "none", textAlign: "left", cursor: "pointer", color: "var(--color-danger)", fontSize: 13 }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {/* ── PROFILE TAB ── */}
          {tab === "profile" && (
            <div className="cc-card">
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Personal Information</div>
              <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="cc-label">Full Name</label>
                    <input type="text" className="cc-input" value={profile.name} onChange={setP("name")} placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="cc-label">Academic Year</label>
                    <select className="cc-select" value={profile.academicYear} onChange={setP("academicYear")}>
                      <option value="">Select year</option>
                      {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="cc-label">Monthly Allowance ($)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-subtle)", fontWeight: 600, fontSize: 14 }}>$</span>
                      <input type="number" className="cc-input" value={profile.monthlyAllowanceBaseline} onChange={setP("monthlyAllowanceBaseline")} placeholder="300" min="0" style={{ paddingLeft: 26 }} />
                    </div>
                  </div>
                  <div>
                    <label className="cc-label">Savings Goal ($)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-subtle)", fontWeight: 600, fontSize: 14 }}>$</span>
                      <input type="number" className="cc-input" value={profile.monthlySavingsGoal} onChange={setP("monthlySavingsGoal")} placeholder="50" min="0" style={{ paddingLeft: 26 }} />
                    </div>
                  </div>
                  <div>
                    <label className="cc-label">Currency</label>
                    <select className="cc-select" value={profile.currency} onChange={setP("currency")}>
                      {["USD", "EUR", "GBP", "PKR", "INR", "SAR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                  <button type="submit" className="cc-btn-primary" disabled={profileSaving}>
                    {profileSaving ? <Spinner size={15} color="#fff" /> : <Save size={15} />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {tab === "security" && (
            <div className="cc-card">
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Change Password</div>
              <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
                {/* Current */}
                <div>
                  <label className="cc-label">Current Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw.current ? "text" : "password"}
                      className="cc-input"
                      value={pwForm.currentPassword}
                      onChange={setPw("currentPassword")}
                      placeholder="Enter current password"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", display: "flex" }}>
                      {showPw.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New */}
                <div>
                  <label className="cc-label">New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw.new ? "text" : "password"}
                      className="cc-input"
                      value={pwForm.newPassword}
                      onChange={setPw("newPassword")}
                      placeholder="Min. 6 characters"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", display: "flex" }}>
                      {showPw.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label className="cc-label">Confirm New Password</label>
                  <input type="password" className="cc-input" value={pwForm.confirmPassword} onChange={setPw("confirmPassword")} placeholder="Re-enter new password" />
                </div>

                {/* Strength indicator */}
                {pwForm.newPassword && (
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-subtle)", marginBottom: 4 }}>Password strength</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4].map(i => {
                        const len = pwForm.newPassword.length;
                        const score = len >= 12 ? 4 : len >= 8 ? 3 : len >= 6 ? 2 : 1;
                        const color = score === 4 ? "var(--color-success)" : score === 3 ? "#22c55e" : score === 2 ? "var(--color-warning)" : "var(--color-danger)";
                        return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? color : "var(--color-border)" }} />;
                      })}
                    </div>
                  </div>
                )}

                <div style={{ paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                  <button type="submit" className="cc-btn-primary" disabled={pwSaving}>
                    {pwSaving ? <Spinner size={15} color="#fff" /> : <Lock size={15} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── APPEARANCE TAB ── */}
          {tab === "appearance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Theme */}
              <div className="cc-card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Theme</div>
                <p style={{ fontSize: 13, color: "var(--color-subtle)", margin: "0 0 16px" }}>Choose your preferred color scheme.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 400 }}>
                  {[
                    { val: "light", label: "Light", icon: <Sun size={20} />, desc: "Clean white interface" },
                    { val: "dark",  label: "Dark",  icon: <Moon size={20} />, desc: "Easy on the eyes" },
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={theme !== t.val ? toggleTheme : undefined}
                      style={{
                        padding: "16px",
                        borderRadius: 12,
                        border: `2px solid ${theme === t.val ? "var(--color-brand)" : "var(--color-border)"}`,
                        background: theme === t.val ? "var(--color-brand-light)" : "transparent",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                        transition: "all 150ms",
                      }}
                    >
                      <div style={{ color: theme === t.val ? "var(--color-brand)" : "var(--color-muted)" }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme === t.val ? "var(--color-brand)" : "var(--color-dark)" }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: "var(--color-subtle)" }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="cc-card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Font Size</div>
                <p style={{ fontSize: 13, color: "var(--color-subtle)", margin: "0 0 16px" }}>Adjust text size for readability.</p>
                <div style={{ display: "flex", gap: 10, maxWidth: 420 }}>
                  {[
                    { val: "small",  label: "Small",  size: "13px" },
                    { val: "medium", label: "Medium", size: "14px" },
                    { val: "large",  label: "Large",  size: "16px" },
                  ].map(f => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => setFontSize(f.val)}
                      style={{
                        flex: 1, padding: "12px 8px",
                        borderRadius: 10,
                        border: `2px solid ${fontSize === f.val ? "var(--color-brand)" : "var(--color-border)"}`,
                        background: fontSize === f.val ? "var(--color-brand-light)" : "transparent",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        transition: "all 150ms",
                      }}
                    >
                      <Type size={fontSize === f.val ? 18 : 14} color={fontSize === f.val ? "var(--color-brand)" : "var(--color-muted)"} />
                      <span style={{ fontSize: f.size, fontWeight: 600, color: fontSize === f.val ? "var(--color-brand)" : "var(--color-muted)" }}>
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DATA TAB ── */}
          {tab === "data" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* CSV Import */}
              <div className="cc-card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Import Transaction History</div>
                <p style={{ fontSize: 13, color: "var(--color-subtle)", margin: "0 0 16px" }}>
                  Upload a CSV file to bulk import your past transactions.
                </p>
                <div style={{ background: "var(--color-page)", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-dark)", marginBottom: 6 }}>Required CSV columns:</div>
                  <code style={{ fontSize: 11, color: "var(--color-muted)", display: "block", lineHeight: 2 }}>
                    date, description, amount, type (income/expense), category<br />
                    <span style={{ color: "var(--color-subtle)" }}>Example: 2024-01-15, Campus Cafe, 5.50, expense, Food</span>
                  </code>
                </div>
                <label className="cc-btn-primary" style={{ cursor: "pointer", alignSelf: "flex-start" }}>
                  {importing ? <Spinner size={15} color="#fff" /> : <Upload size={15} />}
                  {importing ? "Importing..." : "Choose CSV File"}
                  <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: "none" }} disabled={importing} />
                </label>
              </div>

              {/* Account info */}
              <div className="cc-card">
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Account Information</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "Email", value: user?.email },
                    { label: "Role", value: user?.role === "admin" ? "Administrator" : "Student" },
                    { label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
                    { label: "Last login", value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: 13, color: "var(--color-subtle)", fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: "var(--color-dark)", fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
