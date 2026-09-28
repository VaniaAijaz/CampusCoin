import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ChevronLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import api from "../../core/api";
import toast from "react-hot-toast";
import "../../features/auth/AuthPages.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your campus email.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
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
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: "#bbf7d0",
                color: "#15803d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 4px 14px rgba(22,163,74,0.15)",
              }}
            >
              <CheckCircle2 style={{ width: 28, height: 28 }} />
            </div>

            <h2 className="auth-form-title" style={{ fontSize: 26, marginBottom: 8 }}>
              Check Your Email
            </h2>

            <p className="auth-form-subtitle" style={{ marginBottom: 28, lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: "var(--auth-foreground)" }}>{email}</strong>, password reset instructions with a secure link have been sent to your inbox.
            </p>

            <Link
              to="/login"
              className="auth-submit-btn"
              style={{ textDecoration: "none" }}
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <div>
            <div className="auth-form-header">
              <div className="auth-badge-kicker">Security Recovery</div>
              <h1 className="auth-form-title">Reset Password</h1>
              <p className="auth-form-subtitle">
                Enter your registered campus email to receive recovery instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="reset-email">
                  Campus Email Address
                </label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" style={{ width: 17, height: 17 }} />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
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
                    <span>Send Reset Instructions</span>
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
          </div>
        )}
      </motion.div>
    </main>
  );
}

