const http = require("http");
const https = require("https");

const VITE_BASE = "http://localhost:5173";
const API_BASE = "http://localhost:5000";

const pages = [
  { name: "Landing",         url: VITE_BASE + "/" },
  { name: "Login",           url: VITE_BASE + "/login" },
  { name: "Register",        url: VITE_BASE + "/register" },
  { name: "Forgot Password", url: VITE_BASE + "/forgot-password" },
  { name: "Dashboard",       url: VITE_BASE + "/app" },
  { name: "Transactions",    url: VITE_BASE + "/app/transactions" },
  { name: "Budget",          url: VITE_BASE + "/app/budget" },
  { name: "Khata",           url: VITE_BASE + "/app/khata" },
  { name: "Subscriptions",   url: VITE_BASE + "/app/subscriptions" },
  { name: "Insights",        url: VITE_BASE + "/app/insights" },
  { name: "Categories",      url: VITE_BASE + "/app/categories" },
  { name: "Profile",         url: VITE_BASE + "/app/profile" },
  { name: "Sitemap",         url: VITE_BASE + "/app/sitemap" },
  { name: "Admin",           url: VITE_BASE + "/admin" },
];

const apiRoutes = [
  { name: "API Health",  url: API_BASE + "/api/health" },
  { name: "API Auth Me", url: API_BASE + "/api/auth/me", expectStatus: 401 },
];

function httpGet(urlStr, timeoutMs) {
  timeoutMs = timeoutMs || 6000;
  return new Promise(function(resolve, reject) {
    var mod = urlStr.startsWith("https") ? https : http;
    var req = mod.get(urlStr, { timeout: timeoutMs }, function(res) {
      var body = "";
      res.on("data", function(chunk) { body += chunk; });
      res.on("end", function() { resolve({ status: res.statusCode, body: body }); });
    });
    req.on("timeout", function() { req.destroy(); reject(new Error("Request timeout")); });
    req.on("error", reject);
  });
}

async function checkViteRoute(name, url) {
  try {
    var r = await httpGet(url, 7000);
    var ok = r.status === 200 && r.body.includes("<div") && r.body.includes("</html>");
    var hasRoot = r.body.includes("id=\"root\"") || r.body.includes("main.jsx") || r.body.includes("main.js");
    if (ok && hasRoot) {
      console.log("[PASS] " + name.padEnd(18) + " -> HTTP " + r.status + " | " + r.body.length + " chars | React root OK");
      return true;
    } else if (ok) {
      console.log("[PASS] " + name.padEnd(18) + " -> HTTP " + r.status + " | " + r.body.length + " chars (Vite shell)");
      return true;
    } else {
      console.log("[FAIL] " + name.padEnd(18) + " -> HTTP " + r.status);
      return false;
    }
  } catch (err) {
    console.log("[FAIL] " + name.padEnd(18) + " -> " + err.message);
    return false;
  }
}

async function checkApiRoute(name, url, expected) {
  expected = expected || 200;
  try {
    var r = await httpGet(url, 5000);
    if (r.status === expected) {
      console.log("[PASS] " + name.padEnd(18) + " -> HTTP " + r.status + " (expected " + expected + ")");
      return true;
    } else {
      console.log("[FAIL] " + name.padEnd(18) + " -> HTTP " + r.status + " (expected " + expected + ")");
      return false;
    }
  } catch (err) {
    console.log("[FAIL] " + name.padEnd(18) + " -> " + err.message);
    return false;
  }
}

(async function main() {
  var pass = 0, fail = 0;
  console.log("\n══════════════════════════════════════════");
  console.log("  CampusCoin UI Route Crawl - HTTP Mode");
  console.log("══════════════════════════════════════════\n");
  console.log("── Vite Frontend Routes ──────────────────");
  for (var i = 0; i < pages.length; i++) {
    var ok = await checkViteRoute(pages[i].name, pages[i].url);
    ok ? pass++ : fail++;
  }
  console.log("\n── Express API Routes ────────────────────");
  for (var j = 0; j < apiRoutes.length; j++) {
    var ok2 = await checkApiRoute(apiRoutes[j].name, apiRoutes[j].url, apiRoutes[j].expectStatus);
    ok2 ? pass++ : fail++;
  }
  var total = pass + fail;
  console.log("\n================================");
  console.log("Total Pages Verified: " + pass + "/" + total + " Passed, " + fail + " Failed");
  console.log("================================\n");
  process.exit(fail > 0 ? 1 : 0);
})();
