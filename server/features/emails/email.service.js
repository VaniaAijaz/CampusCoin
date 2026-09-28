const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER;
const emailPass = (process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

// ── Nodemailer Transporter ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: emailUser, pass: emailPass },
  tls: { rejectUnauthorized: false },
});

// ── Core Send Utility ─────────────────────────────────────────────────────────
const sendEmail = async (to, subject, htmlTemplate) => {
  try {
    const info = await transporter.sendMail({
      from: `"Campus Coin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlTemplate,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
};

// ── Premium Base Template ─────────────────────────────────────────────────────
// Clean white card design matching the Campus Coin brand (sky-blue + indigo)
const generateBaseTemplate = (title, previewText, content) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      margin: 0; padding: 0;
      background: linear-gradient(150deg, #f0f7ff 0%, #e0f2fe 50%, #dbeafe 100%);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #0f172a;
    }
    .wrapper { width: 100%; padding: 48px 20px; background: linear-gradient(150deg, #f0f7ff 0%, #e0f2fe 50%, #dbeafe 100%); }
    .card {
      background: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 580px;
      border-radius: 20px;
      border: 1px solid rgba(172, 217, 251, 0.6);
      box-shadow: 0 4px 32px rgba(37, 99, 235, 0.08), 0 1px 4px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    /* Header strip */
    .header {
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%);
      padding: 36px 40px 32px;
      text-align: center;
      position: relative;
    }
    .header-logo-mark {
      display: inline-block;
      width: 48px; height: 48px;
      background: rgba(255,255,255,0.15);
      border-radius: 14px;
      margin-bottom: 14px;
      line-height: 48px;
      font-size: 24px;
    }
    .header-brand {
      font-size: 22px; font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.4px;
      margin: 0 0 4px;
    }
    .header-sub {
      font-size: 12px; font-weight: 600;
      color: rgba(255,255,255,0.65);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    /* Body */
    .body { padding: 40px 40px 32px; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px; letter-spacing: -0.3px; }
    .lead { font-size: 15px; color: #475569; line-height: 1.65; margin: 0 0 28px; }
    /* Info box */
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 22px 24px;
      margin-bottom: 28px;
    }
    .info-box-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin: 0 0 14px; }
    /* CTA Button */
    .cta-wrap { text-align: center; margin-bottom: 28px; }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.01em;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .cta-btn-danger {
      background: linear-gradient(135deg, #dc2626, #ef4444);
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
    }
    .cta-btn-green {
      background: linear-gradient(135deg, #059669, #10b981);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
    }
    /* OTP Box */
    .otp-box {
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      border-radius: 16px;
      padding: 28px 24px;
      text-align: center;
      margin-bottom: 28px;
    }
    .otp-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.65); margin: 0 0 12px; }
    .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace; margin: 0 0 10px; }
    .otp-expiry { font-size: 12px; color: rgba(255,255,255,0.6); margin: 0; }
    /* Step list */
    .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .step-num {
      flex-shrink: 0;
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      color: #fff;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 800;
      text-align: center;
      line-height: 28px;
    }
    .step-text { font-size: 14px; color: #334155; line-height: 1.5; padding-top: 5px; }
    .step-text strong { color: #0f172a; }
    /* Stat row */
    .stat-row { display: flex; gap: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 28px; }
    .stat-cell { flex: 1; padding: 18px 16px; text-align: center; background: #f8fafc; }
    .stat-cell + .stat-cell { border-left: 1px solid #e2e8f0; }
    .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 0 0 6px; }
    .stat-value { font-size: 20px; font-weight: 800; margin: 0; }
    /* Progress bar */
    .progress-track { background: #e2e8f0; border-radius: 99px; height: 10px; overflow: hidden; margin-bottom: 8px; }
    .progress-fill { height: 100%; border-radius: 99px; }
    /* Warning box */
    .warning-box {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    /* Divider */
    .divider { border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    /* Footer */
    .footer { padding: 24px 40px 32px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer-brand { font-size: 13px; font-weight: 800; color: #2563eb; margin: 0 0 6px; }
    .footer-tagline { font-size: 11px; color: #94a3b8; margin: 0 0 14px; }
    .footer-links { font-size: 11px; color: #cbd5e1; }
    .footer-links a { color: #94a3b8; text-decoration: none; }
    @media (max-width: 600px) {
      .body { padding: 28px 24px 24px; }
      .header { padding: 28px 24px 24px; }
      .footer { padding: 20px 24px 24px; }
      .otp-code { font-size: 32px; letter-spacing: 6px; }
      .stat-row { flex-direction: column; }
      .stat-cell + .stat-cell { border-left: 0; border-top: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="header-logo-mark">🪙</div>
        <p class="header-brand">Campus Coin</p>
        <p class="header-sub">Student Financial Hub</p>
      </div>
      <!-- Body -->
      <div class="body">
        ${content}
      </div>
      <!-- Footer -->
      <div class="footer">
        <p class="footer-brand">Campus Coin</p>
        <p class="footer-tagline">Smart finance for smart students · Techwiz 7 Entry</p>
        <p class="footer-links">
          © ${new Date().getFullYear()} Campus Coin. All rights reserved.<br>
          <a href="${process.env.CLIENT_URL || "http://localhost:5173"}">Visit Dashboard</a>
          &nbsp;·&nbsp;
          <a href="mailto:${process.env.EMAIL_USER || "support@campuscoin.pk"}">Contact Support</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

// ── 1. Welcome Email ──────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, name) => {
  const firstName = (name || "Student").split(" ")[0];
  const content = `
    <h1 class="title">Welcome aboard, ${firstName}! 🎉</h1>
    <p class="lead">Your Campus Coin account is ready. We've built a financial hub designed specifically for student life — track income, control spending, and let AI guide your money decisions.</p>

    <div class="info-box">
      <p class="info-box-title">Get started in 3 steps</p>
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text"><strong>Log your first transaction</strong> — add an income source or an expense in seconds.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text"><strong>Set monthly budgets</strong> — cap spending on food, transit, or entertainment.</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text"><strong>Check AI Insights</strong> — get tailored financial advice based on your real habits.</div>
      </div>
    </div>

    <div class="cta-wrap">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/app" class="cta-btn cta-btn-green">Open My Dashboard →</a>
    </div>

    <p style="font-size:13px;color:#94a3b8;text-align:center;">
      If you didn't create this account, please disregard this email.
    </p>
  `;
  const html = generateBaseTemplate("Welcome to Campus Coin", "Your student financial hub is ready.", content);
  await sendEmail(email, `Welcome to Campus Coin, ${firstName}! 🪙 Your hub is ready.`, html);
};

// ── 2. Password Reset Email ───────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
  const content = `
    <h1 class="title">Reset your password</h1>
    <p class="lead">We received a request to reset the password for your Campus Coin account. Click the button below to set a new one — this link expires in <strong>1 hour</strong>.</p>

    <div class="cta-wrap">
      <a href="${resetUrl}" class="cta-btn">Reset Password →</a>
    </div>

    <hr class="divider">

    <div class="warning-box">
      ⚠️ <strong>Didn't request this?</strong> If you didn't ask for a password reset, safely ignore this email. Your password will remain unchanged and the link will expire automatically.
    </div>

    <p style="font-size:12px;color:#cbd5e1;text-align:center;">
      For security, never share this email with anyone. Campus Coin will never ask for your password.
    </p>
  `;
  const html = generateBaseTemplate("Password Reset — Campus Coin", "Reset your Campus Coin password securely.", content);
  await sendEmail(email, "Campus Coin — Password Reset Request", html);
};

// ── 3. Budget Alert Email ─────────────────────────────────────────────────────
const sendBudgetAlertEmail = async (email, categoryName, spentAmount, limitAmount) => {
  const percentage = Math.min(Math.round((spentAmount / limitAmount) * 100), 100);
  const isOver = percentage >= 100;
  const fillColor = isOver ? "#ef4444" : percentage >= 90 ? "#f97316" : "#eab308";
  const content = `
    <h1 class="title">${isOver ? "🚨 Budget Exceeded" : "⚠️ Budget Warning"}</h1>
    <p class="lead">You've used <strong>${percentage}%</strong> of your <strong>${categoryName}</strong> budget for this month. ${isOver ? "You've gone over your limit." : "You're close to your limit — time to slow down spending."}</p>

    <div class="info-box">
      <p class="info-box-title">${categoryName} Budget Status</p>
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
        <tr>
          <td style="font-size:13px;color:#475569;">Spent</td>
          <td style="font-size:15px;font-weight:800;color:#ef4444;text-align:right;">$${Number(spentAmount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#475569;padding-top:4px;">Budget Limit</td>
          <td style="font-size:15px;font-weight:800;color:#0f172a;text-align:right;padding-top:4px;">$${Number(limitAmount).toFixed(2)}</td>
        </tr>
      </table>
      <div class="progress-track">
        <div class="progress-fill" style="width:${percentage}%;background:${fillColor};"></div>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:right;margin-top:6px;">${percentage}% used</p>
    </div>

    <div class="info-box" style="background:#eff6ff;border-color:#bfdbfe;">
      <p class="info-box-title" style="color:#2563eb;">💡 Quick Tip</p>
      <p style="font-size:14px;color:#1e40af;margin:0;">Consider pausing ${categoryName.toLowerCase()} spending for the rest of the month. Review recurring items — you may find subscriptions or habits that can be trimmed.</p>
    </div>

    <div class="cta-wrap">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/app/budget" class="cta-btn cta-btn-danger">Review My Budgets →</a>
    </div>
  `;
  const html = generateBaseTemplate(`Budget Alert: ${categoryName}`, `You've used ${percentage}% of your ${categoryName} budget.`, content);
  await sendEmail(email, `${isOver ? "🚨" : "⚠️"} ${categoryName} Budget ${isOver ? "Exceeded" : "Warning"} — Campus Coin`, html);
};

// ── 4. Monthly Statement Email ────────────────────────────────────────────────
const sendMonthlyStatementEmail = async (email, monthName, totalIn, totalOut) => {
  const net = totalIn - totalOut;
  const isPositive = net >= 0;
  const content = `
    <h1 class="title">${monthName} Summary 📊</h1>
    <p class="lead">Your financial statement for <strong>${monthName}</strong> is ready. Here's a quick snapshot of how your money moved this month.</p>

    <div class="stat-row">
      <div class="stat-cell">
        <p class="stat-label">Total Income</p>
        <p class="stat-value" style="color:#059669;">+$${Number(totalIn).toFixed(2)}</p>
      </div>
      <div class="stat-cell">
        <p class="stat-label">Total Expenses</p>
        <p class="stat-value" style="color:#ef4444;">-$${Number(totalOut).toFixed(2)}</p>
      </div>
      <div class="stat-cell">
        <p class="stat-label">Net Balance</p>
        <p class="stat-value" style="color:${isPositive ? "#2563eb" : "#ef4444"};">${isPositive ? "+" : ""}$${Math.abs(net).toFixed(2)}</p>
      </div>
    </div>

    <div class="cta-wrap">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/app/reports" class="cta-btn">View Full Report →</a>
    </div>
  `;
  const html = generateBaseTemplate(`${monthName} Statement — Campus Coin`, `Your ${monthName} financial summary is ready.`, content);
  await sendEmail(email, `Your ${monthName} Statement is Ready — Campus Coin`, html);
};

// ── 5. Email Verification (6-Digit Activation Code) ──────────────────────────
const sendVerificationEmail = async (email, name, otp) => {
  const firstName = (name || "there").split(" ")[0];
  const content = `
    <h1 class="title">Activate your account ✉️</h1>
    <p class="lead">Hi <strong>${firstName}</strong>, welcome to Campus Coin! Enter the 6-digit activation code below in the app to verify your email and complete registration.</p>

    <div class="otp-box">
      <p class="otp-label">Your 6-Digit Activation Code</p>
      <p class="otp-code">${(otp || "------").toString().split("").join(" ")}</p>
      <p class="otp-expiry">Expires in 24 hours · Do not share this code with anyone</p>
    </div>

    <div class="info-box" style="background:#eff6ff;border-color:#bfdbfe;">
      <p class="info-box-title" style="color:#2563eb;">🔒 Security Notice</p>
      <p style="font-size:13px;color:#1e40af;margin:0;">Campus Coin staff will never ask for your 6-digit code. If you didn't create an account with this email address, you can safely ignore this message.</p>
    </div>

    <p style="font-size:12px;color:#94a3b8;text-align:center;">
      Smart finance for smart students · Techwiz 7 Entry
    </p>
  `;
  const html = generateBaseTemplate("Activate Your Campus Coin Account", "Your 6-digit account activation code.", content);
  return await sendEmail(email, "Activate Your Campus Coin Account — Verification Code 🪙", html);
};

// ── 6. Budget Alert Email (alias for tests) ───────────────────────────────────
module.exports = {
  transporter,
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBudgetAlertEmail,
  sendMonthlyStatementEmail,
};
