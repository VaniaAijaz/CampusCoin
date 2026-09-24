# Campus Coin — Smart Spending, Student Style

A full-stack MERN web application for student budget and expense tracking with AI-powered insights.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS v4, Chart.js       |
| Backend   | Node.js, Express.js                             |
| Database  | MongoDB + Mongoose                              |
| Auth      | JWT + bcrypt                                    |
| Icons     | Lucide React                                    |

---

## Prerequisites

Install these before starting:

1. **Node.js** v18 or higher — https://nodejs.org
2. **MongoDB** (local) — https://www.mongodb.com/try/download/community  
   OR use a free cloud cluster at https://cloud.mongodb.com

---

## Installation

### 1. Clone / Open the project
```
cd CampusCoin
```

### 2. Install Server dependencies
```
cd server
npm install
```

### 3. Configure Server environment
The file `server/.env` is already pre-configured for local development.  
Edit `MONGO_URI` if your MongoDB runs on a different port or you use Atlas:

```
MONGO_URI=mongodb://localhost:27017/campuscoin
JWT_SECRET=campuscoin_jwt_secret_key_2024_secure
PORT=5000
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@campuscoin.com
ADMIN_PASSWORD=Admin@123
```

### 4. Install Client dependencies
```
cd ../client
npm install
```

---

## Running the Application

Open **two terminal windows**:

**Terminal 1 — Backend:**
```
cd server
npm run dev
```
Server runs at: http://localhost:5000

**Terminal 2 — Frontend:**
```
cd client
npm run dev
```
Frontend runs at: http://localhost:5173

Open http://localhost:5173 in your browser.

---

## User Credentials

| Role    | Email                   | Password   |
|---------|-------------------------|------------|
| Admin   | admin@campuscoin.com    | Admin@123  |
| Student | Register a new account  | Your choice|

The admin account is automatically seeded on first server start.

---

## Features

### Student Features
- Register / Login / Password Reset
- Dashboard with income vs expense charts, balance, saving tips
- Add/Edit/Delete income and expense transactions
- AI-powered category suggestions as you type
- Recurring transaction support
- Monthly budget goals per category with real-time progress bars
- In-app alerts when budget is near or exceeded
- Category management (personal + default)
- Monthly reports with PDF export
- AI-generated monthly spending insights
- Bookmark and pin insights
- CSV transaction import
- Dark mode + font size settings

### Admin Features
- Platform statistics dashboard
- User management (view, enable/disable, delete)
- Default category management
- System-wide announcements

---

## Project Structure

```
CampusCoin/
├── server/                    # Express.js backend
│   ├── controllers/           # Route handlers
│   ├── middleware/            # JWT auth middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API route definitions
│   ├── utils/                 # DB connection, seeding, token
│   ├── index.js               # Server entry point
│   └── .env                   # Environment variables
│
└── client/                    # React frontend
    ├── src/
    │   ├── api/               # Axios instance
    │   ├── components/        # Reusable UI + layout components
    │   ├── context/           # Auth + Theme context
    │   ├── pages/             # All application pages
    │   │   └── auth/          # Login, Register, Reset pages
    │   └── index.css          # Tailwind v4 design system
    ├── index.html
    └── vite.config.js
```

---

## AI Tools Used

- **Kiro (AI IDE)** — Used as a coding assistant for scaffolding, code generation guidance, and debugging support.
- All business logic, design decisions, and implementation were reviewed, understood, and directed by the development team.

---

## Notes

- No real banking integration — all data is manually entered or CSV-imported.
- AI categorization is rule-based keyword matching (no external API required).
- AI insights are generated from the user's own transaction history.
- All AI suggestions are advisory and can be overridden.
