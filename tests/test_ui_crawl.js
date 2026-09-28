const { chromium } = require("@playwright/test");

const pages = [
  { name: "Landing", url: "http://localhost:5173/" },
  { name: "Login", url: "http://localhost:5173/login" },
  { name: "Register", url: "http://localhost:5173/register" },
  { name: "Forgot Password", url: "http://localhost:5173/forgot-password" },
  { name: "Dashboard", url: "http://localhost:5173/app", auth: "student" },
  { name: "Transactions", url: "http://localhost:5173/app/transactions", auth: "student" },
  { name: "Budget", url: "http://localhost:5173/app/budget", auth: "student" },
  { name: "Khata", url: "http://localhost:5173/app/khata", auth: "student" },
  { name: "Subscriptions", url: "http://localhost:5173/app/subscriptions", auth: "student" },
  { name: "Insights", url: "http://localhost:5173/app/insights", auth: "student" },
  { name: "Categories", url: "http://localhost:5173/app/categories", auth: "student" },
  { name: "Profile", url: "http://localhost:5173/app/profile", auth: "student" },
  { name: "Sitemap", url: "http://localhost:5173/app/sitemap", auth: "student" },
  { name: "Admin", url: "http://localhost:5173/admin", auth: "admin" },
];

(async () => {
  const browser = await chromium.launch();
  let totalPass = 0;
  let totalFail = 0;

  for (const p of pages) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    if (p.auth === "student") {
      await context.addInitScript(() => {
        window.localStorage.setItem("cc_token", "demo-mock-student-token");
        window.localStorage.setItem("cc_user", JSON.stringify({
          _id: "demo-student-id-test",
          name: "Alex Rivera",
          email: "student@campuscoin.pk",
          role: "std123",
          isVerified: true,
          isDemo: true,
          currency: "USD"
        }));
      });
    } else if (p.auth === "admin") {
      await context.addInitScript(() => {
        window.localStorage.setItem("cc_token", "demo-mock-admin-token");
        window.localStorage.setItem("cc_user", JSON.stringify({
          _id: "demo-admin-id-test",
          name: "System Admin",
          email: "admin@campuscoin.pk",
          role: "admin123",
          isVerified: true,
          isDemo: true
        }));
      });
    }

    const page = await context.newPage();
    try {
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 7000 });
      await page.waitForTimeout(600);
      const text = await page.innerText("body");
      if (text.length > 50) {
        console.log(`[PASS] ${p.name.padEnd(16)} -> URL: ${page.url()} (${text.length} chars rendered)`);
        totalPass++;
      } else {
        console.log(`[FAIL] ${p.name.padEnd(16)} -> Insufficient content rendered`);
        totalFail++;
      }
    } catch (err) {
      console.log(`[FAIL] ${p.name.padEnd(16)} -> Error: ${err.message}`);
      totalFail++;
    }
    await context.close();
  }

  console.log(`\n================================`);
  console.log(`Total Pages Verified: ${totalPass}/${pages.length} Passed, ${totalFail} Failed`);
  console.log(`================================`);

  await browser.close();
  process.exit(totalFail > 0 ? 1 : 0);
})();
