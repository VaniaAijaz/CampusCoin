import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ChevronLeft, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import api from "../../core/api";
import toast from "react-hot-toast";
import "../../features/auth/AuthPages.css";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      if (data.success) {
        toast.success("Password reset successfully! Redirecting to sign in...");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. The token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="auth-grid-bg" />
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      {/* Top Bar */}
      <div style={{ position: "fixed", top: 24, left: 24, zIndex: 50 }}>
        <Link to="/login" className="auth-back-link">
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Sign In
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="auth-form-box"
      >
        <div className="auth-form-header">
          <div className="auth-badge-kicker">Account Security</div>
          <h1 className="auth-form-title">Create New Password</h1>
          <p className="auth-form-subtitle">
            Choose a strong, memorable password for your CampusCoin account.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* New Password */}
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="new-password">
              New Password
            </label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" style={{ width: 17, height: 17 }} />
              <input
                id="new-password"
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="auth-input-field has-toggle"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="auth-pwd-toggle"
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="auth-input-group">
            <label className="auth-input-label" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" style={{ width: 17, height: 17 }} />
              <input
                id="confirm-password"
                type={showPass ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="auth-input-field"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#ffffff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            ) : (
              <>
                <KeyRound style={{ width: 16, height: 16 }} />
                <span>Update Password</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
          <Link
            to="/login"
            className="auth-footer-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
