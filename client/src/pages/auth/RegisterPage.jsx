import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Spinner from "../../components/ui/Spinner";

const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Masters", "PhD", "Other"];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    academicYear: "", monthlyAllowanceBaseline: "", monthlySavingsGoal: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email) e.email = "Email is required.";
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
        email: form.email,
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
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  const field = (label, key, type = "text", placeholder = "", extra = {}) => (
    <div>
      <label className="cc-label">{label}</label>
      <input
        type={type}
        className="cc-input"
        placeholder={placeholder}
        value={form[key]}
        onChange={set(key)}
        style={errors[key] ? { borderColor: "var(--color-danger)" } : {}}
        {...extra}
      />
      {errors[key] && <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div className="cc-card" style={{ padding: "32px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Create your account</h2>
        <p style={{ fontSize: 13, color: "var(--color-subtle)", marginTop: 6 }}>
          Free forever. No credit card needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {field("Full Name", "name", "text", "Your full name")}
        {field("Email Address", "email", "email", "you@university.edu", { autoComplete: "email" })}

        {/* Password */}
        <div>
          <label className="cc-label">Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              className="cc-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set("password")}
              style={{ paddingRight: 44, ...(errors.password ? { borderColor: "var(--color-danger)" } : {}) }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", display: "flex",
            }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="cc-label">Confirm Password</label>
          <input
            type="password"
            className="cc-input"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            style={errors.confirmPassword ? { borderColor: "var(--color-danger)" } : {}}
          />
          {errors.confirmPassword && <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{errors.confirmPassword}</p>}
        </div>

        {/* Optional fields */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 12, color: "var(--color-subtle)", margin: 0 }}>
            Optional — helps personalise your experience
          </p>

          <div>
            <label className="cc-label">Academic Year</label>
            <select className="cc-select" value={form.academicYear} onChange={set("academicYear")}>
              <option value="">Select year</option>
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="cc-label">Monthly Allowance ($)</label>
              <input
                type="number"
                className="cc-input"
                placeholder="e.g. 300"
                value={form.monthlyAllowanceBaseline}
                onChange={set("monthlyAllowanceBaseline")}
                min="0"
              />
            </div>
            <div>
              <label className="cc-label">Savings Goal ($)</label>
              <input
                type="number"
                className="cc-input"
                placeholder="e.g. 50"
                value={form.monthlySavingsGoal}
                onChange={set("monthlySavingsGoal")}
                min="0"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="cc-btn-primary" style={{ width: "100%", marginTop: 4 }} disabled={loading}>
          {loading ? <Spinner size={17} color="#fff" /> : <UserPlus size={16} />}
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <hr className="cc-divider" style={{ margin: "0 0 16px" }} />
        <p style={{ fontSize: 13, color: "var(--color-subtle)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-brand)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
