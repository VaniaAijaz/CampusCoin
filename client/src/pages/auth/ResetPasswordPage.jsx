import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Spinner from "../../components/ui/Spinner";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      if (data.success) {
        toast.success("Password reset successfully. Logging you in...");
        if (data.token) {
          // Token returned — we need user data
          const me = await api.get("/auth/me", { headers: { Authorization: `Bearer ${data.token}` } });
          login(me.data.user, data.token);
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-card" style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Set new password</h2>
        <p style={{ fontSize: 13, color: "var(--color-subtle)", marginTop: 6 }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="cc-label">New Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              className="cc-input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "var(--color-subtle)", display: "flex",
            }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="cc-label">Confirm Password</label>
          <input
            type="password"
            className="cc-input"
            placeholder="Re-enter new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" className="cc-btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? <Spinner size={17} color="#fff" /> : <KeyRound size={16} />}
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Link to="/login" style={{ fontSize: 13, color: "var(--color-muted)", textDecoration: "none" }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
