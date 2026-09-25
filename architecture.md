# Campus Coin Feature-Based Architecture Hierarchy

This project utilizes a **Feature-Driven Architecture**. Instead of grouping files by technical role (e.g., all controllers together, all components together), files are grouped by their business feature. This ensures modularity, making the codebase highly scalable and easily digestible for AI agents and senior developers.

## Root Level
```text
campus-coin/
├── .env                      # Unified environment variables for both environments
├── package.json              # Concurrently scripts ("npm run dev")
├── architecture.md           # Architecture documentation
├── README.md                 # Setup & overview documentation
├── server/                   # Express/Node Backend
└── client/                   # React/Vite Frontend
```

## Backend (Server) Data Flow & Hierarchy

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

## Frontend (Client) Data Flow & Hierarchy

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

## Component Interaction Flow

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

