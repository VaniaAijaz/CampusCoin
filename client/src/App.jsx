import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import LoadingScreen from "./components/ui/LoadingScreen";
import { lazy, Suspense } from "react";

// Public Landing & Split Auth Pages
import LandingPage from "./features/landing/LandingPage";
import SplitAuthPage from "./features/auth/SplitAuthPage";
import Gatekeeper from "./pages/Gatekeeper";

const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

// Domain-driven Feature Pages
import DashboardPage from "./features/dashboard/DashboardPage";
import TransactionsPage from "./features/transactions/TransactionsPage";
import BudgetPage from "./features/budgets/BudgetPage";
import InsightsPage from "./features/insights/InsightsPage";

// Lazy loaded feature pages
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const CategoriesPage = lazy(() => import("./features/categories/CategoriesPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const AdminPage = lazy(() => import("./features/admin/AdminPage"));

const FallbackLoader = () => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
  </div>
);

// Global Static Pages
import SitemapPage from "./pages/SitemapPage";
import NotFoundPage from "./pages/NotFoundPage";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/app" replace />;
  return children;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* 2. Public Direct Auth Routes */}
      <Route path="/login" element={<SplitAuthPage defaultMode="login" />} />
      <Route path="/register" element={<SplitAuthPage defaultMode="register" />} />
      <Route path="/forgot-password" element={<Suspense fallback={<FallbackLoader />}><ForgotPasswordPage /></Suspense>} />
      <Route path="/reset-password/:token" element={<Suspense fallback={<FallbackLoader />}><ResetPasswordPage /></Suspense>} />

      {/* 3. Top-Level Canonical Aliases (Redirects direct URL requests to nested /app paths) */}
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/transactions" element={<Navigate to="/app/transactions" replace />} />
      <Route path="/budget" element={<Navigate to="/app/budget" replace />} />
      <Route path="/budgets" element={<Navigate to="/app/budget" replace />} />
      <Route path="/insights" element={<Navigate to="/app/insights" replace />} />
      <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
      <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
      <Route path="/subscriptions" element={<Navigate to="/app/transactions" replace />} />
      <Route path="/debts" element={<Navigate to="/app" replace />} />
      <Route path="/iou" element={<Navigate to="/app" replace />} />
      <Route path="/sitemap" element={<Navigate to="/app/sitemap" replace />} />

      {/* 4. App Workspace - Secured by Gatekeeper */}
      <Route path="/app" element={<Gatekeeper />}>
        {/* Main Dashboard */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/app" replace />} />

        {/* Feature Sub-routes */}
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="budgets" element={<Navigate to="/app/budget" replace />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="subscriptions" element={<Navigate to="/app/transactions" replace />} />
        <Route path="debts" element={<Navigate to="/app" replace />} />
        <Route path="iou" element={<Navigate to="/app" replace />} />
        
        {/* Lazy Loaded Routes */}
        <Route path="reports" element={<Suspense fallback={<FallbackLoader />}><ReportsPage /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<FallbackLoader />}><CategoriesPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<FallbackLoader />}><ProfilePage /></Suspense>} />
        <Route path="settings" element={<Navigate to="/app/profile" replace />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><Suspense fallback={<FallbackLoader />}><AdminPage /></Suspense></ProtectedRoute>} />
        
        <Route path="sitemap" element={<SitemapPage />} />
      </Route>

      {/* 5. Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
