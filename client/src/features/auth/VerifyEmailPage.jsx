import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, RefreshCw, ChevronLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "../../core/api";
import toast from "react-hot-toast";
import "./AuthPages.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const tokenParam = searchParams.get("token");
  const emailParam = searchParams.get("email") || user?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [autoVerifying, setAutoVerifying] = useState(Boolean(tokenParam));

  const inputRefs = useRef([]);

  // Auto-verify if ?token= query parameter is present in URL
  useEffect(() => {
    if (tokenParam) {
      handleTokenVerification(tokenParam);
    }
  }, [tokenParam]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTokenVerification = async (token) => {
    setLoading(true);
    setAutoVerifying(true);
    try {
      const { data } = await api.post("/auth/verify-email", { token });
      if (data.success) {
        toast.success(data.message || "Account activated! Please sign in to continue.");
        logout();
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification link is invalid or expired.");
    } finally {
      setLoading(false);
      setAutoVerifying(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const updated = [...otp];
      updated[index] = "";
      setOtp(updated);
      return;
    }

    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const updated = [...otp];
      chars.forEach((c, i) => {
        if (i < 6) updated[i] = c;
      });
      setOtp(updated);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = clean;
    setOtp(updated);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-email", {
        otp: code,
        email: emailParam,
      });

      if (data.success) {
        toast.success(data.message || "Account activated! Please sign in to continue.");
        logout();
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam) {
      toast.error("Unable to identify email address to resend code.");
      return;
    }

    setResending(true);
    try {
      const { data } = await api.post("/auth/resend-verification", { email: emailParam });
      toast.success(data.message || "A new 6-digit code has been sent!");
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="auth-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="auth-grid-bg" />
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      {/* Top Bar */}
      <div style={{ position: "fixed", top: 24, left: 24, zIndex: 50, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={handleBackToLogin}
          className="auth-back-link"
        >
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Sign In
        </button>
      </div>

      {/* Verification Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="auth-form-box"
        style={{ textAlign: "center", maxWidth: 480 }}
      >
        {/* Verification Icon Pod */}
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 20px",
            borderRadius: 16,
            backgroundColor: "#dbeafe",
            color: "var(--auth-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37,99,235,0.15)",
          }}
        >
          <Mail style={{ width: 26, height: 26 }} />
        </div>

        <h1 className="auth-form-title" style={{ fontSize: 28, marginBottom: 8 }}>
          Verify Your Email
        </h1>

        <p className="auth-form-subtitle" style={{ maxWidth: 360, margin: "0 auto 28px" }}>
          We sent a 6-digit confirmation code to{" "}
          <strong style={{ color: "var(--auth-foreground)" }}>{emailParam || "your email"}</strong>. Enter the code below to activate your account.
        </p>

        {autoVerifying ? (
          <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 32,
                height: 32,
                border: "3px solid #cbd5e1",
                borderTopColor: "var(--auth-blue)",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.6s linear infinite",
              }}
            />
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--auth-muted)" }}>Verifying secure token...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 6-Digit OTP Inputs */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  style={{
                    width: 48,
                    height: 56,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 800,
                    fontFamily: "inherit",
                    borderRadius: 14,
                    border: "1.5px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "var(--auth-foreground)",
                    outline: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--auth-blue)";
                    e.target.style.boxShadow = "0 0 0 3.5px rgba(37,99,235,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.03)";
                  }}
                />
              ))}
            </div>

            {/* Confirm Button */}
            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
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
                  <span>Activate Account</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Resend Action */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: "var(--auth-muted)",
          }}
        >
          <span>Didn&apos;t receive a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending}
            className="auth-footer-btn"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {resending ? (
              <RefreshCw style={{ width: 14, height: 14, animation: "spin 0.6s linear infinite" }} />
            ) : countdown > 0 ? (
              <span>Resend in {countdown}s</span>
            ) : (
              <span>Resend Code</span>
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}

