import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./features/auth/AuthContext";
import LoadingScreen from "./components/ui/LoadingScreen";
import { lazy, Suspense, useEffect } from "react";

// Public Landing & Split Auth Pages
import LandingPage from "./features/landing/LandingPage";
import SplitAuthPage from "./features/auth/SplitAuthPage";
import VerifyEmailPage from "./features/auth/VerifyEmailPage";
import Gatekeeper from "./pages/Gatekeeper";

const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

// Domain-driven Feature Pages
import DashboardPage from "./features/dashboard/DashboardPage";
import TransactionsPage from "./features/transactions/TransactionsPage";
import BudgetPage from "./features/budgets/BudgetPage";
import KhataPage from "./features/khata/KhataPage";

// Lazy loaded feature pages
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const CategoriesPage = lazy(() => import("./features/categories/CategoriesPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const SubscriptionsPage = lazy(() => import("./features/subscriptions/SubscriptionsPage"));
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

function DemoRoute() {
  const { enterDemoMode } = useAuth();
  useEffect(() => {
    enterDemoMode();
  }, [enterDemoMode]);
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;

  return (
    <Routes location={location}>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoRoute />} />
      
      {/* 2. Public Direct Auth Routes */}
      <Route path="/login" element={<SplitAuthPage defaultMode="login" />} />
      <Route path="/register" element={<SplitAuthPage defaultMode="register" />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<Suspense fallback={<FallbackLoader />}><ForgotPasswordPage /></Suspense>} />
      <Route path="/reset-password/:token" element={<Suspense fallback={<FallbackLoader />}><ResetPasswordPage /></Suspense>} />

      {/* 3. Top-Level Canonical Aliases (Redirects direct URL requests to nested /app paths) */}
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/transactions" element={<Navigate to="/app/transactions" replace />} />
      <Route path="/budget" element={<Navigate to="/app/budget" replace />} />
      <Route path="/budgets" element={<Navigate to="/app/budget" replace />} />
      <Route path="/khata" element={<Navigate to="/app/khata" replace />} />
      <Route path="/iou" element={<Navigate to="/app/khata" replace />} />
      <Route path="/debts" element={<Navigate to="/app/khata" replace />} />
      <Route path="/insights" element={<Navigate to="/app" replace />} />
      <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
      <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
      <Route path="/subscriptions" element={<Navigate to="/app/subscriptions" replace />} />
      <Route path="/sitemap" element={<Navigate to="/app/sitemap" replace />} />

      {/* 4. Strict Dedicated Admin Workspace (Completely Isolated from Student Dashboard) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<FallbackLoader />}>
              <AdminPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* 5. Student App Workspace - Secured by Gatekeeper */}
      <Route path="/app" element={<Gatekeeper />}>
        {/* Main Dashboard */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/app" replace />} />

        {/* Feature Sub-routes */}
        <Route path="verify" element={<VerifyEmailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="khata" element={<KhataPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="budgets" element={<Navigate to="/app/budget" replace />} />
        <Route path="insights" element={<Navigate to="/app" replace />} />
        <Route path="subscriptions" element={<Suspense fallback={<FallbackLoader />}><SubscriptionsPage /></Suspense>} />
        <Route path="debts" element={<Navigate to="/app/khata" replace />} />
        <Route path="iou" element={<Navigate to="/app/khata" replace />} />
        
        {/* Lazy Loaded Routes */}
        <Route path="reports" element={<Suspense fallback={<FallbackLoader />}><ReportsPage /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<FallbackLoader />}><CategoriesPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<FallbackLoader />}><ProfilePage /></Suspense>} />
        <Route path="settings" element={<Navigate to="/app/profile" replace />} />
        <Route path="admin" element={<Navigate to="/admin" replace />} />
        
        <Route path="sitemap" element={<SitemapPage />} />
      </Route>

      {/* 5. Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
