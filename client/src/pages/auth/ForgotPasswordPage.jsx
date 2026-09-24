import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Spinner from "../../components/ui/Spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email."); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      // In development the token is returned in response
      if (data.resetToken) setResetToken(data.resetToken);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="cc-card" style={{ padding: "32px", textAlign: "center" }}>
        <div style={{
          width: 52, height: 52,
          background: "var(--color-success-bg)",
          borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Mail size={24} color="var(--color-success)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your email</h2>
        <p style={{ fontSize: 13, color: "var(--color-subtle)", marginBottom: 20 }}>
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </p>
        {resetToken && (
          <div style={{
            background: "var(--color-brand-light)", borderRadius: 9, padding: "12px 16px",
            marginBottom: 20, textAlign: "left",
          }}>
            <p style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 600, margin: "0 0 4px" }}>
              DEV MODE — Reset Token:
            </p>
            <p style={{ fontSize: 11, color: "var(--color-brand)", wordBreak: "break-all", margin: 0 }}>
              {resetToken}
            </p>
            <Link
              to={`/reset-password/${resetToken}`}
              style={{ fontSize: 12, color: "var(--color-brand)", fontWeight: 600, textDecoration: "none", display: "block", marginTop: 6 }}
            >
              → Click here to reset password
            </Link>
          </div>
        )}
        <Link to="/login" style={{ fontSize: 13, color: "var(--color-brand)", fontWeight: 600, textDecoration: "none" }}>
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="cc-card" style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Reset your password</h2>
        <p style={{ fontSize: 13, color: "var(--color-subtle)", marginTop: 6 }}>
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="cc-label">Email address</label>
          <input
            type="email"
            className="cc-input"
            placeholder="you@university.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="cc-btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? <Spinner size={17} color="#fff" /> : <Mail size={16} />}
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Link to="/login" style={{
          fontSize: 13, color: "var(--color-muted)", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
