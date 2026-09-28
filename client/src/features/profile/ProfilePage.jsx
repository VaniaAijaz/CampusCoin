import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Lock, PiggyBank, GraduationCap, DollarSign,
  Save, LogOut, Check, ChevronDown,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import api from "../../core/api";
import toast from "react-hot-toast";

/* ── exact landing page tokens ── */
const C = {
  hero:        "oklch(0.115 0.018 255)",
  heroFg:      "oklch(0.985 0.003 250)",
  heroLine:    "oklch(0.31 0.025 255)",
  brand:       "oklch(0.59 0.22 262)",
  brandSoft:   "oklch(0.93 0.06 262)",
  highlight:   "oklch(0.88 0.18 157)",
  highlightFg: "oklch(0.17 0.04 160)",
  growth:      "oklch(0.64 0.17 157)",
  growthSoft:  "oklch(0.94 0.05 158)",
  foreground:  "oklch(0.16 0.025 260)",
  muted:       "oklch(0.5 0.025 255)",
  border:      "oklch(0.9 0.012 255)",
  altBg:       "oklch(0.965 0.01 254)",
};
const M = { fontFamily: "'Manrope',ui-sans-serif,system-ui,sans-serif" };

const inputSt = {
  width:"100%", padding:"10px 14px", borderRadius:999,
  background:C.altBg, border:`1.5px solid ${C.border}`,
  fontSize:13, color:C.foreground, outline:"none",
  fontFamily:M.fontFamily, transition:"border-color 0.15s", boxSizing:"border-box",
};

/* reusable section card */
const Section = ({ label, title, children, style }) => (
  <div style={{
    background:"#fff", border:`1.5px solid ${C.border}`,
    borderRadius:8, padding:"24px 24px 20px", ...style,
  }}>
    <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 5px" }}>{label}</p>
    <h3 style={{ fontSize:18, fontWeight:900, color:C.foreground, margin:"0 0 20px", letterSpacing:"-0.02em", paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>{title}</h3>
    {children}
  </div>
);

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { toggleMode, isDark, themes, themeId, selectTheme } = useTheme();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const currencyRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const currencies = [
    { value:"USD", label:"USD ($)" },
    { value:"EUR", label:"EUR (€)" },
    { value:"PKR", label:"PKR (Rs)" },
  ];

  const handleCurrencyChange = async (val) => {
    setCurrencyDropdownOpen(false);
    if (form.currency === val) return;
    setForm(p => ({ ...p, currency: val }));
    try {
      const { data } = await api.put("/users/profile/currency", { currency_preference: val });
      if (data.success) { updateUser(data.user); queryClient.invalidateQueries(); toast.success(`Currency changed to ${val}`); }
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

  const [passwords, setPasswords] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass,  setChangingPass]  = useState(false);

  useEffect(() => {
    if (user) setForm({ name:user.name||"", academicYear:user.academicYear||"", monthlyAllowanceBaseline:user.monthlyAllowanceBaseline||0, monthlySavingsGoal:user.monthlySavingsGoal||0, currency:user.currency||"USD" });
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      if (data.success) { updateUser(data.user); toast.success("Profile updated!"); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update profile."); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Passwords do not match."); return; }
    setChangingPass(true);
    try {
      const { data } = await api.put("/auth/change-password", { currentPassword:passwords.currentPassword, newPassword:passwords.newPassword });
      if (data.success) { toast.success("Password updated!"); setPasswords({ currentPassword:"", newPassword:"", confirmPassword:"" }); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to change password."); }
    finally { setChangingPass(false); }
  };

  return (
    <div style={{ ...M, display:"flex", flexDirection:"column", gap:20, maxWidth:900, margin:"0 auto" }}>

      {/* ── HEADER ── */}
      <div>
        <p style={{ fontSize:11, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.14em", color:C.brand, margin:"0 0 6px" }}>Account</p>
        <h1 style={{ fontSize:"clamp(1.6rem,4vw,2.4rem)", fontWeight:900, color:C.foreground, margin:0, letterSpacing:"-0.03em", lineHeight:1 }}>
          Profile & Settings
        </h1>
        <p style={{ fontSize:14, color:C.muted, margin:"6px 0 0", fontWeight:500 }}>
          Manage your personal info, preferences and security settings.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:20, alignItems:"start" }}>

        {/* ── LEFT: Identity card — dark hero panel ── */}
        <div style={{
          background:C.hero, borderRadius:8,
          padding:"28px 24px",
          position:"relative", overflow:"hidden",
          display:"flex", flexDirection:"column", alignItems:"center", gap:0,
        }}>
          {/* grid overlay */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.12,
            backgroundImage:`linear-gradient(${C.heroLine} 1px,transparent 1px),linear-gradient(90deg,${C.heroLine} 1px,transparent 1px)`,
            backgroundSize:"48px 48px" }} />

          <div style={{ position:"relative", zIndex:1, width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}>
            {/* Avatar — landing page brandMark style */}
            <div style={{
              width:72, height:72, borderRadius:20,
              background:`linear-gradient(135deg, ${C.brand}, oklch(0.61 0.23 290))`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28, fontWeight:900, color:"#fff",
              boxShadow:`0 12px 32px ${C.brand}55`, marginBottom:16,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <h3 style={{ fontSize:17, fontWeight:800, color:C.heroFg, margin:"0 0 4px", textAlign:"center" }}>{user?.name}</h3>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:"0 0 10px", textAlign:"center" }}>{user?.email}</p>

            <span style={{
              fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em",
              padding:"3px 12px", borderRadius:999,
              background: user?.role==="admin" ? `${C.highlight}22` : `${C.brand}30`,
              color: user?.role==="admin" ? C.highlight : "rgba(255,255,255,0.7)",
              border:`1px solid ${user?.role==="admin" ? C.highlight+"40" : "rgba(255,255,255,0.15)"}`,
            }}>
              {user?.role==="admin" ? "Campus Admin" : "Active Student"}
            </span>

            {/* Stats */}
            <div style={{ width:"100%", marginTop:20, paddingTop:16, borderTop:`1px solid ${C.heroLine}`, display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Academic Year",       value:user?.academicYear || "Unspecified"                    },
                { label:"Monthly Allowance",   value:`$${user?.monthlyAllowanceBaseline || 0}`              },
                { label:"Savings Goal",        value:`$${user?.monthlySavingsGoal || 0}`                    },
                { label:"Preferred Currency",  value:user?.currency || "USD"                                },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:500 }}>{r.label}</span>
                  <span style={{ fontSize:12, color:C.heroFg, fontWeight:700 }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Theme toggles */}
            <div style={{ width:"100%", marginTop:16, paddingTop:16, borderTop:`1px solid ${C.heroLine}`, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>Appearance</span>
                <button type="button" onClick={toggleMode} style={{
                  padding:"5px 12px", borderRadius:999, cursor:"pointer",
                  background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)",
                  color:C.heroFg, fontSize:11, fontWeight:600, ...M,
                }}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </button>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:500 }}>Palette</span>
                <div style={{ display:"flex", gap:6 }}>
                  {themes.map(th => {
                    const bgSwatch = th.swatch || (th.color ? `rgb(${Math.round(th.color[0]*255)},${Math.round(th.color[1]*255)},${Math.round(th.color[2]*255)})` : "#3B82F6");
                    return (
                      <button key={th.id} type="button" onClick={() => selectTheme(th.id)} title={th.name} style={{
                        width:22, height:22, borderRadius:"50%", cursor:"pointer",
                        border: themeId===th.id ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)",
                        background: bgSwatch,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transform: themeId===th.id ? "scale(1.15)" : "scale(1)", transition:"all 0.15s",
                      }}>
                        {themeId===th.id && <Check style={{ width:10, color:"#fff", strokeWidth:3 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sign out */}
            <button onClick={async () => {
              try { await api.post("/users/logout-session"); } catch (_) {}
              logout(); navigate("/login");
            }} style={{
              width:"100%", marginTop:20,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:"11px 0", borderRadius:999, cursor:"pointer",
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)",
              color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600, ...M, transition:"all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.12)"; e.currentTarget.style.color=C.heroFg; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color="rgba(255,255,255,0.6)"; }}
            >
              <LogOut style={{ width:14 }} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── RIGHT: forms ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Profile form */}
          <Section label="Academic Profile" title="Personal Information">
            <form onSubmit={handleProfileSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { label:"Full Name",    field:"name",         type:"text",   placeholder:"Your full name" },
                  { label:"Academic Year",field:"academicYear", type:"text",   placeholder:"e.g. Year 2, Sophomore" },
                  { label:"Monthly Allowance ($)", field:"monthlyAllowanceBaseline", type:"number", placeholder:"0", step:"10", min:"0" },
                  { label:"Savings Goal ($)",      field:"monthlySavingsGoal",       type:"number", placeholder:"0", step:"10", min:"0" },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:7 }}>{f.label}</label>
                    <input type={f.type} required={f.field==="name"} placeholder={f.placeholder}
                      step={f.step} min={f.min}
                      value={form[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: f.type==="number" ? Number(e.target.value) : e.target.value }))}
                      style={inputSt}
                      onFocus={e => e.target.style.borderColor=C.brand}
                      onBlur={e => e.target.style.borderColor=C.border}
                    />
                  </div>
                ))}
              </div>

              {/* Currency */}
              <div ref={currencyRef} style={{ position:"relative" }}>
                <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:7 }}>Currency</label>
                <button type="button" onClick={() => setCurrencyDropdownOpen(o => !o)} style={{
                  ...inputSt, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", textAlign:"left",
                }}>
                  <span>{currencies.find(c => c.value===form.currency)?.label || "Select"}</span>
                  <ChevronDown style={{ width:14, color:C.muted, flexShrink:0 }} />
                </button>
                {currencyDropdownOpen && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, marginTop:4, background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:12, overflow:"hidden", zIndex:50, boxShadow:"0 8px 24px rgba(0,0,0,0.08)" }}>
                    {currencies.map(c => (
                      <button key={c.value} type="button" onClick={() => handleCurrencyChange(c.value)} style={{
                        display:"block", width:"100%", padding:"10px 14px", textAlign:"left",
                        fontSize:13, fontWeight: form.currency===c.value ? 700 : 500,
                        color: form.currency===c.value ? C.brand : C.foreground,
                        background: form.currency===c.value ? C.brandSoft : "#fff",
                        border:"none", cursor:"pointer", ...M, transition:"background 0.1s",
                      }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button type="submit" disabled={savingProfile} style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  height:42, padding:"0 22px", borderRadius:999,
                  background:C.highlight, color:C.highlightFg,
                  border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M,
                  opacity:savingProfile ? 0.7 : 1, boxShadow:`0 4px 16px ${C.highlight}55`,
                }}>
                  <Save style={{ width:14 }} />
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </form>
          </Section>

          {/* Password */}
          <Section label="Security" title="Change Password">
            <form onSubmit={handlePasswordSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[
                  { label:"Current Password",  field:"currentPassword"  },
                  { label:"New Password",       field:"newPassword"      },
                  { label:"Confirm Password",   field:"confirmPassword"  },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:7 }}>{f.label}</label>
                    <input type="password" required placeholder="••••••••" value={passwords[f.field]}
                      onChange={e => setPasswords(p => ({ ...p, [f.field]: e.target.value }))}
                      style={inputSt}
                      onFocus={e => e.target.style.borderColor=C.brand}
                      onBlur={e => e.target.style.borderColor=C.border}
                    />
                  </div>
                ))}
              </div>
              <div>
                <button type="submit" disabled={changingPass} style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  height:42, padding:"0 22px", borderRadius:999,
                  background:C.hero, color:C.heroFg,
                  border:"none", fontSize:14, fontWeight:800, cursor:"pointer", ...M,
                  opacity:changingPass ? 0.7 : 1,
                }}>
                  <Lock style={{ width:14 }} />
                  {changingPass ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </Section>

        </div>
      </div>
    </div>
  );
}
