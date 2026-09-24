import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Spinner from "../../components/ui/Spinner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
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
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: "" }));
  };

  return (
    <div className="cc-card" style={{ padding: "32px 32px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sign in to your account</h2>
        <p style={{ fontSize: 13, color: "var(--color-subtle)", marginTop: 6 }}>
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Email */}
        <div>
          <label className="cc-label">Email address</label>
          <input
            type="email"
            className="cc-input"
            placeholder="you@university.edu"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
            style={errors.email ? { borderColor: "var(--color-danger)" } : {}}
          />
          {errors.email && <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label className="cc-label" style={{ margin: 0 }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: 12, color: "var(--color-brand)", textDecoration: "none", fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              className="cc-input"
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              autoComplete="current-password"
              style={{ paddingRight: 44, ...(errors.password ? { borderColor: "var(--color-danger)" } : {}) }}
            />
            <button
              type="button"
              onClick={() => setShowPass(s => !s)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)",
                display: "flex", alignItems: "center", padding: 0,
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p style={{ fontSize: 12, color: "var(--color-danger)", marginTop: 4 }}>{errors.password}</p>}
        </div>

        <button type="submit" className="cc-btn-primary" style={{ width: "100%", marginTop: 4 }} disabled={loading}>
          {loading ? <Spinner size={17} color="#fff" /> : <LogIn size={16} />}
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <hr className="cc-divider" style={{ margin: "0 0 20px" }} />
        <p style={{ fontSize: 13, color: "var(--color-subtle)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--color-brand)", fontWeight: 600, textDecoration: "none" }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
