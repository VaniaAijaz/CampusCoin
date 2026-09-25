import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import Layout from "./core/Layout";
import LoadingScreen from "./components/ui/LoadingScreen";
import { lazy, Suspense } from "react";

// Landing & Gatekeeper
import LandingPage from "./features/landing/LandingPage";
import Gatekeeper from "./pages/Gatekeeper";

const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));

// Domain-driven Feature Pages
import DashboardPage from "./features/dashboard/DashboardPage";
import TransactionsPage from "./features/transactions/TransactionsPage";
import BudgetPage from "./features/budgets/BudgetPage";
import InsightsPage from "./features/insights/InsightsPage";

// Lazy load
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const CategoriesPage = lazy(() => import("./features/categories/CategoriesPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const AdminPage = lazy(() => import("./features/admin/AdminPage"));

const FallbackLoader = () => (
  <div className="w-full h-96 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
  </div>
);

// Global Static Pages
import SitemapPage from "./pages/SitemapPage";
import NotFoundPage from "./pages/NotFoundPage";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/app" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/app/dashboard" replace />;
  return children;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Utility Routes (Outside Gatekeeper) */}
      <Route path="/forgot-password" element={<Suspense fallback={<FallbackLoader />}><ForgotPasswordPage /></Suspense>} />
      <Route path="/reset-password/:token" element={<Suspense fallback={<FallbackLoader />}><ResetPasswordPage /></Suspense>} />

      <Route path="/app" element={<Gatekeeper />}>
        {/* These routes will render inside the Gatekeeper's Layout if authenticated */}
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/app" replace />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="insights" element={<InsightsPage />} />
        
        {/* Lazy Loaded Routes */}
        <Route path="reports" element={<Suspense fallback={<FallbackLoader />}><ReportsPage /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<FallbackLoader />}><CategoriesPage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<FallbackLoader />}><ProfilePage /></Suspense>} />
        <Route path="admin" element={<ProtectedRoute adminOnly><Suspense fallback={<FallbackLoader />}><AdminPage /></Suspense></ProtectedRoute>} />
        
        <Route path="sitemap" element={<SitemapPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
