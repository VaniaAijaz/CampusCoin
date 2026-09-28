# Campus Coin - NextGen BudgetBee Web Solution

Website: : https://shifting-sappiness-rudder.ngrok-free.dev/

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

## Architecture & Data Flow

This project utilizes a **Feature-Driven Architecture**. Instead of grouping files by technical role (e.g., all controllers together, all components together), files are grouped by their business feature. This ensures modularity, making the codebase highly scalable and easily digestible for AI agents and senior developers.

### Root Level
```text
campus-coin/
├── .env                      # Unified environment variables for both environments
├── package.json              # Concurrently scripts ("npm run dev")
├── README.md                 # Setup & overview documentation
├── server/                   # Express/Node Backend
└── client/                   # React/Vite Frontend
```

### Backend (Server) Data Flow & Hierarchy

Requests enter the server, pass through global middleware, and are routed to specific feature domains.

```text
server/
├── server.js                 # Entry point, mounts middleware and API router
├── core/                     # Global configurations
│   ├── db.js                 # MongoDB connection
│   ├── authMiddleware.js     # JWT & Admin protection
│   ├── errorMiddleware.js    # Global error & 404 handler
│   ├── generateToken.js      # JWT token generator
│   └── seed.js               # Initial admin & default category seeder
└── features/                 # DOMAIN-DRIVEN MODULES
    ├── auth/
    │   ├── auth.routes.js    # Express router for /api/auth
    │   ├── auth.controller.js# Login/Register logic
    │   └── User.model.js     # Mongoose Schema
    ├── transactions/
    │   ├── transaction.routes.js
    │   ├── transaction.controller.js # Aggregation pipelines for dashboard
    │   └── Transaction.model.js
    ├── budgets/
    │   ├── budget.routes.js
    │   ├── budget.controller.js
    │   └── Budget.model.js
    ├── categories/
    │   ├── category.routes.js
    │   ├── category.controller.js
    │   └── Category.model.js
    ├── insights/
    │   ├── insight.routes.js
    │   ├── insight.controller.js # Spending velocity & plain-text advice
    │   └── Insight.model.js
    ├── reports/
    │   ├── report.routes.js
    │   └── report.controller.js
    ├── tips/
    │   ├── tip.routes.js
    │   └── tip.controller.js
    └── admin/
        ├── admin.routes.js
        ├── admin.controller.js
        └── Announcement.model.js
```

### Frontend (Client) Data Flow & Hierarchy

The React application follows the same feature-based grouping. UI components directly map to the backend feature APIs.

```text
client/
├── src/
│   ├── main.jsx              # React DOM mounting
│   ├── App.jsx               # React Router configuration
│   ├── core/                 # Global UI & Config
│   │   ├── api.js            # Axios base instance with JWT interceptor
│   │   └── Layout.jsx        # Glassmorphism Sidebar and background wrapper
│   └── features/             # DOMAIN-DRIVEN UI MODULES
│       ├── auth/
│       │   ├── AuthContext.jsx # Global user state & JWT verification
│       │   └── LoginForm.jsx   # Frosted glass card with demo pills
│       ├── dashboard/
│       │   ├── DashboardPage.jsx # Composes various feature components
│       │   ├── BalanceCard.jsx   # Hero balance & daily burn rate
│       │   └── TrendChart.jsx    # Recharts 6-month flow with useMemo
│       ├── transactions/
│       │   ├── TransactionsPage.jsx
│       │   ├── TransactionModal.jsx # Quick-add form with AI category suggestions
│       │   └── transactionApi.js    # Axios calls specifically for transactions
│       ├── budgets/
│       │   ├── BudgetPage.jsx
│       │   ├── BudgetProgressRing.jsx # Real-time gamified SVG circular rings
│       │   └── budgetApi.js
│       ├── insights/
│       │   ├── InsightsPage.jsx
│       │   ├── AiInsightsCard.jsx    # Plain-text actionable advice & velocity
│       │   └── insightsApi.js
│       ├── reports/
│       │   ├── ReportsPage.jsx
│       │   └── reportsApi.js
│       ├── categories/
│       │   ├── CategoriesPage.jsx
│       │   └── categoryApi.js
│       ├── profile/
│       │   └── ProfilePage.jsx
│       └── admin/
│           └── AdminPage.jsx
```

### Component Interaction Flow

1. **User Action:** User clicks "Add Record" or "Quick Log" on `DashboardPage.jsx` or in the sidebar.
2. **UI Rendering:** `TransactionModal.jsx` (from `features/transactions/`) opens using the glassmorphism Tailwind classes (`bg-white/5 backdrop-blur-xl border border-white/10`).
3. **AI Autocategorization:** While typing the description, `aiCategorizeDescription` suggests a matching category.
4. **API Call:** Form submission triggers `transactionApi.js` -> POST request to `/api/transactions`.
5. **Backend Routing:** `server/features/transactions/transaction.routes.js` receives the payload and authenticates via JWT middleware.
6. **Business Logic & Pipeline:** `transaction.controller.js` checks for duplicate/spike flags, updates `Transaction.model.js`, recalculates the corresponding monthly cap in `Budget.model.js`, and returns the populated record.
7. **State Synchronization:** `window.dispatchEvent(new CustomEvent("campuscoin:txUpdated"))` fires, causing `DashboardPage.jsx`, `TrendChart.jsx` (via `useMemo`), and `BudgetProgressRing.jsx` to immediately refresh with the latest calculations.

---

## Enterprise Error Architecture & System Error Registry

Campus Coin implements a strict Zero Data Leakage error-handling contract. All client-facing exceptions adhere to the unified JSON schema:

```json
{
  "success": false,
  "errorCode": "ERR_AUTH_001",
  "message": "User didn't exist. You may have to sign up."
}
```

### Complete System Error Registry

| Error Code | HTTP Status | Public Message | Internal Cause |
| :--- | :---: | :--- | :--- |
| **Authentication (`ERR_AUTH_*`)** | | | |
| `ERR_AUTH_001` | 404 | User didn't exist. You may have to sign up. | Queried user account does not exist in the database (email lookup or Firebase UID miss). |
| `ERR_AUTH_002` | 409 | An account with this email already exists. | Registration attempt violates unique email constraint or duplicate index collision. |
| `ERR_AUTH_003` | 401 | Invalid email or password. | Password hash mismatch during bcrypt comparison or missing login credentials. |
| `ERR_AUTH_004` | 401 | Not authorized. No session token provided. | Request header missing `Authorization: Bearer <token>` or token is empty. |
| `ERR_AUTH_005` | 401 | Session token expired or invalid. | JWT verification failure (`JsonWebTokenError` / `TokenExpiredError`). |
| `ERR_AUTH_006` | 403 | Forbidden. Account disabled or insufficient permissions. | User flag `isActive: false` or student role attempting admin endpoint. |
| `ERR_AUTH_007` | 400 | Password reset token is invalid or has expired. | Reset token hash not found in MongoDB or `resetPasswordExpires` elapsed. |
| **Transactions (`ERR_TX_*`)** | | | |
| `ERR_TX_001` | 400 | Transaction amount must be a positive number. | Payload amount validation failure (amount <= 0 or non-numeric input). |
| `ERR_TX_002` | 400 | Invalid transaction payload or missing category. | Mongoose `ValidationError` on required fields (categoryId, type, date). |
| `ERR_TX_003` | 404 | Transaction record not found. | Transaction ID not found in database or belongs to a different student. |
| `ERR_TX_004` | 400 | Resource not found or invalid identifier format. | Malformed MongoDB `ObjectId` triggering Mongoose `CastError`. |
| `ERR_TX_005` | 409 | Duplicate transaction suspected. | High-frequency duplicate transaction guard triggered within a 30-second window. |
| `ERR_TX_006` | 400 | CSV transaction file parsing failed. | Corrupt or invalid CSV header structure during batch transaction import. |
| **Subscriptions (`ERR_SUB_*`)** | | | |
| `ERR_SUB_001` | 400 | Subscription service name and amount are required. | Missing mandatory subscription parameters during creation or update. |
| `ERR_SUB_002` | 404 | Subscription not found. | Subscription record ID does not exist for the authenticated user. |
| `ERR_SUB_003` | 400 | Invalid billing cycle or due date. | Due date in invalid ISO format or cycle outside permitted enum values. |
| `ERR_SUB_004` | 502 | Brand logo lookup service unavailable. | External Clearbit/Logo.dev API timeout, rate limit, or network failure. |
| **IOUs & Debts (`ERR_DEBT_*`)** | | | |
| `ERR_DEBT_001` | 400 | Counterparty name and positive amount are required. | Missing peer name or amount <= 0 when registering an IOU. |
| `ERR_DEBT_002` | 404 | Debt record not found. | IOU debt ID not found or unauthorized access attempt. |
| `ERR_DEBT_003` | 400 | Settlement amount exceeds remaining balance. | Partial settlement payment exceeds current outstanding balance. |
| `ERR_DEBT_004` | 409 | Debt is already marked as fully settled. | Attempting to apply payment to an IOU with status `settled`. |
| **AI Insights (`ERR_AI_*`)** | | | |
| `ERR_AI_001` | 503 | AI financial advisor temporarily unavailable. | Google Gemini API quota exceeded, rate limit hit, or upstream outage. |
| `ERR_AI_002` | 500 | AI recommendation service configuration missing. | Missing or unconfigured `GEMINI_API_KEY` in environment variables. |
| `ERR_AI_003` | 422 | Insufficient transaction data to generate AI insights. | User has insufficient transaction history to calculate velocity or meaningful advice. |
| `ERR_AI_004` | 504 | AI model response generation timed out. | Gemini inference gateway timeout exceeded (>15s). |
| **System Failures (`ERR_SYS_*`)** | | | |
| `ERR_SYS_400` | 400 | Bad request syntax or parameters. | Malformed JSON payload or invalid request syntax. |
| `ERR_SYS_404` | 404 | Requested API route was not found on this server. | Route does not match any registered Express endpoint path. |
| `ERR_SYS_500` | 500 | Internal server error. | Unhandled runtime exception, database disconnect, or unhandled system error. |
| `ERR_SYS_502` | 502 | Upstream service or caching failure. | Redis cache connection failure or unreachable cache node. |
| `ERR_SYS_503` | 503 | Campus Coin service temporarily undergoing maintenance. | Database connection pool exhausted or MongoDB reconnection retry failure. |

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
