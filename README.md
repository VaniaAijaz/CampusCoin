# Campus Coin - NextGen BudgetBee Web Solution

Campus Coin is a lightweight, student-first financial tracking web application built to track income, expenses, and budgeting without requiring bank integrations. Designed with a premium Glassmorphism SaaS aesthetic, it empowers users with manual transaction logging, gamified budget tracking, and AI-driven spending insights.

## Core Features & AI Agent Context
- **User Authentication:** JWT-based secure login, registration, and session management with demo student and admin presets.
- **Transaction Engine:** Quick-add forms for logging income and expenses, supporting custom and default categories with real-time AI category suggestion.
- **Dynamic Dashboard:** Real-time calculation of current month balances, 6-month income vs. expense trends, and visual data representation.
- **Gamified Budgeting:** Users set monthly category caps (e.g., Food: $50). The system visually tracks spending against these caps using circular SVG progress rings.
- **AI Insights:** The system analyzes spending velocity and category trends to generate plain-text, actionable financial advice with urgency badges and potential savings metrics.

## Database Relational Map
The application utilizes MongoDB (NoSQL), but strictly enforces the following logical relationships:
1. **User (1) -> (M) Transactions:** `userId` on Transaction references the User.
2. **User (1) -> (M) Budgets:** `userId` on Budget references the User.
3. **Category (1) -> (M) Transactions:** `categoryId` on Transaction references the custom or default Category.
4. **User (1) -> (M) Categories:** Users can own custom categories alongside system-wide default categories.

## Setup & Execution
The project is a monorepo configured for simultaneous execution.
1. Unified root `.env` contains `MONGO_URI`, `JWT_SECRET`, `PORT=5000`, and `VITE_API_BASE_URL=http://localhost:5000/api`.
2. Run `npm install` in the root directory.
3. Run `npm run dev` from the root directory to start both the Express API and Vite React client concurrently via `concurrently`.

## Default Credentials
- **Admin**: `admin@campuscoin.com` / `Admin@123`
- **Student**: `student@campus.edu` / `Password123` (or register a free account)

---

## Comprehensive Test Suites & Verification

All automated test suites are strictly consolidated under the `tests/` directory.

### Quick Commands

| Test Suite | Command | Description |
| :--- | :--- | :--- |
| **Run All Suites** | `npm run test:all` | Executes Jest backend suites, UI 14-page crawler, and Playwright E2E |
| **All Unit/Integration Tests** | `npm test` | Runs all Jest unit and integration tests across the platform |
| **Master Playwright E2E** | `npm run test:e2e` | 14-step full browser flow, theme matrix, modals, and mutations |
| **14-Page UI Crawler** | `npm run test:ui-crawl` | Validates rendering, layout, and DOM structure of all 14 routes |
| **Nodemailer Password Reset** | `npm run test:email` | Tests Nodemailer transporter, reset token hashing, and email delivery |
| **Currency & Dynamic Data Layer** | `npm run test:currency` | Multi-currency (USD/EUR/PKR) rates, live conversion, and Khata ledger |
| **Budget Limits & Boundary** | `npm run test:budget` | 0%, 50%, 80%, 100%, 101% spent boundary conditions and caps |
| **Dashboard Analytics** | `npm run test:dashboard` | Reactive balance calculation, monthly trend history, and breakdown |
| **Authentication & Verification** | `npm run test:auth` | Registration, login, JWT cookies, role isolation, and session handling |
| **Transactions CRUD** | `npm run test:transactions` | Income/Expense logging, CSV parsing, soft deletion, and filtering |
| **AI Financial Insights** | `npm run test:insights` | Dedicated AI Insights tab, budget adjust recommendations, bookmarks |
| **AI Categorization Engine** | `npm run test:categorization` | Keyword recognition and student manual override rules |
| **Admin Telemetry & Security** | `npm run test:admin` | System health telemetry, announcement broadcast, and user management |
| **Monetization & Ad Gating** | `npm run test:ads` | Student free vs premium tier ad rendering rules |
| **Auth Guards & Route Protection**| `npm run test:authgate` | React client router authentication guards and unauthorized redirects |

### Testing Individual Files Directly

You can also run any specific test file directly using Jest or Playwright:

```bash
# Nodemailer password reset notification
npx jest tests/nodemailer_reset_email.test.js

# Playwright E2E test suite
npx playwright test tests/e2e/campuscoin-master.spec.ts

# Multi-currency and data layer test
npx jest tests/currency_and_data_layer.test.js

# Budget engine test
npx jest tests/budget.test.js

# Dashboard reactive test
npx jest tests/dashboard.test.js

# UI crawler test
node tests/test_ui_crawl.js
```

