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
2. Run `npm run install:all` (or `npm install` in the root, `/server`, and `/client` directories).
3. Run `npm run dev` from the root directory to start both the Express API and Vite React client concurrently via `concurrently`.

## Default Credentials
- **Admin**: `admin@campuscoin.com` / `Admin@123`
- **Student**: `student@campus.edu` / `Password123` (or register a free account)
