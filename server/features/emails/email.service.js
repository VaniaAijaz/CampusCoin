const nodemailer = require("nodemailer");

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Reusable utility function
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
    // Do not throw to avoid crashing the server
  }
};

// Faux Glassmorphism Base Template
const generateBaseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0B0D0E;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #D4D4D8;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0B0D0E;
      padding: 40px 20px;
    }
    .main-table {
      background-color: #14171A;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 16px;
      border: 1px solid #27272A;
      border-spacing: 0;
      overflow: hidden;
    }
    .logo-container {
      text-align: center;
      padding: 30px 20px 10px;
    }
    .logo-text {
      color: #3B82F6;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content-area {
      padding: 20px 40px 40px;
    }
    h1, h2 {
      color: #FFFFFF;
      margin-top: 0;
      font-weight: 700;
    }
    p {
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      background-color: #3B82F6;
      color: #FFFFFF;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 50px;
      font-weight: 600;
      text-align: center;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      font-size: 12px;
      color: #71717A;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" align="center">
      <tr>
        <td class="logo-container">
          <h2 class="logo-text">Campus Coin</h2>
        </td>
      </tr>
      <tr>
        <td class="content-area">
          ${content}
          <div class="footer">
            &copy; ${new Date().getFullYear()} Campus Coin. Built for Techwiz 7.<br>
            If you have any questions, please reply to this email.
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

// 1. New Account Welcome
const sendWelcomeEmail = async (email, name) => {
  const content = `
    <h1>Welcome to Campus Coin, ${name}!</h1>
    <p>Your financial hub is ready. We've built Campus Coin to help you track the everyday, plan for what matters, and make the most of student life.</p>
    
    <div style="background-color: #0B0D0E; padding: 20px; border-radius: 12px; border: 1px solid #27272A; margin-bottom: 24px;">
      <h3 style="color: #FFFFFF; margin-top: 0;">Getting Started is Easy:</h3>
      <ol style="margin-bottom: 0; padding-left: 20px; color: #D4D4D8;">
        <li style="margin-bottom: 10px;"><strong>Add your first transaction:</strong> Log an income or expense.</li>
        <li style="margin-bottom: 10px;"><strong>Set a budget:</strong> Cap spending on food, transit, or fun.</li>
        <li><strong>Check AI insights:</strong> Get tailored advice based on your habits.</li>
      </ol>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/app" class="cta-button">Go to Dashboard</a>
    </div>
  `;

  const html = generateBaseTemplate("Welcome to Campus Coin", content);
  await sendEmail(email, "Welcome to Campus Coin! Your financial hub is ready.", html);
};

// 2. Password Reset Request
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const content = `
    <h1>Password Reset Request</h1>
    <p>We received a request to reset your password for your Campus Coin account. You can securely reset it by clicking the button below.</p>
    
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${resetUrl}" class="cta-button">Reset Password</a>
    </div>

    <p style="font-size: 13px; color: #71717A;">
      ⚠️ <strong>If you didn't request this, safely ignore this email.</strong> Your password will remain unchanged, and this link will expire in 15 minutes.
    </p>
  `;

  const html = generateBaseTemplate("Password Reset Request", content);
  await sendEmail(email, "Campus Coin - Password Reset Request", html);
};

// 3. Budget Limit Alert
const sendBudgetAlertEmail = async (email, categoryName, spentAmount, limitAmount) => {
  const percentage = Math.min(Math.round((spentAmount / limitAmount) * 100), 100);
  
  const content = `
    <h1 style="color: #E11D48;">⚠️ Budget Alert</h1>
    <p>You've reached <strong>${percentage}%</strong> of your <strong>${categoryName}</strong> budget for this month.</p>
    
    <div style="background-color: #0B0D0E; padding: 20px; border-radius: 12px; border: 1px solid #27272A; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #FFFFFF; font-weight: 600;">
        <span>Spent: $${spentAmount.toFixed(2)}</span>
        <span>Limit: $${limitAmount.toFixed(2)}</span>
      </div>
      
      <!-- Faux Progress Bar -->
      <div style="width: 100%; height: 8px; background-color: #27272A; border-radius: 4px; overflow: hidden;">
        <div style="width: ${percentage}%; height: 100%; background-color: #E11D48; border-radius: 4px;"></div>
      </div>
    </div>
    
    <p style="font-size: 14px; background-color: #3B82F620; border-left: 4px solid #3B82F6; padding: 12px; color: #FFFFFF;">
      <strong>Quick Tip:</strong> Consider pausing spending in this category for the rest of the week to ensure you don't break your cap!
    </p>

    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/app/budget" class="cta-button">Review Budgets</a>
    </div>
  `;

  const html = generateBaseTemplate(`Budget Alert: ${categoryName}`, content);
  await sendEmail(email, `⚠️ Action Required: ${categoryName} Budget Alert`, html);
};

// 4. Monthly Statement Ready
const sendMonthlyStatementEmail = async (email, monthName, totalIn, totalOut) => {
  const content = `
    <h1>Your ${monthName} Statement is Ready</h1>
    <p>Your official financial statement for the month of ${monthName} is now available in your Campus Coin dashboard.</p>
    
    <div style="background-color: #0B0D0E; padding: 20px; border-radius: 12px; border: 1px solid #27272A; margin-bottom: 24px; text-align: center;">
      <h3 style="color: #FFFFFF; margin-top: 0; margin-bottom: 20px;">Executive Summary</h3>
      
      <table width="100%" cellspacing="0" cellpadding="0" style="table-layout: fixed;">
        <tr>
          <td style="text-align: center; border-right: 1px solid #27272A;">
            <div style="color: #71717A; font-size: 12px; margin-bottom: 4px;">Total Inflow</div>
            <div style="color: #10B981; font-weight: bold; font-size: 18px;">+$${totalIn.toFixed(2)}</div>
          </td>
          <td style="text-align: center;">
            <div style="color: #71717A; font-size: 12px; margin-bottom: 4px;">Total Outflow</div>
            <div style="color: #F43F5E; font-weight: bold; font-size: 18px;">-$${totalOut.toFixed(2)}</div>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.CLIENT_URL}/app/reports" class="cta-button">Download PDF Statement</a>
    </div>
  `;

  const html = generateBaseTemplate(`${monthName} Statement Ready`, content);
  await sendEmail(email, `Your ${monthName} Statement is Ready`, html);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBudgetAlertEmail,
  sendMonthlyStatementEmail
};
