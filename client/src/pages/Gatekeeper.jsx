import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import Layout from "../core/Layout";
import SplitAuthPage from "../features/auth/SplitAuthPage";
import DashboardSkeleton from "../components/ui/DashboardSkeleton";
import VerifyEmailPage from "../features/auth/VerifyEmailPage";

export default function Gatekeeper() {
  const { user, isAuthenticated, isLoading, loading } = useAuth();
  const location = useLocation();
  const isAuthLoading = isLoading !== undefined ? isLoading : loading;

  // 1. Strict Auth Gate: If isLoading is true, render the exact Glass Skeleton (Zero CLS, no flickering)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen p-6 md:p-8 bg-[#050914]">
        <DashboardSkeleton />
      </div>
    );
  }

  // 2. Unauthenticated: redirect to login
  if (!isAuthenticated) {
    return <SplitAuthPage defaultMode="login" />;
  }

  // 3. Mandatory Email Verification Gate:
  // Real registered users must verify their email.
  // DEMO USERS bypass verification completely so the reviewer can freely test the UI/UX.
  const isDemo = Boolean(user?.isDemo || user?._id?.startsWith("demo") || user?.email?.includes("campuscoin.com"));
  const isVerified = Boolean(user?.isVerified || user?.role === "admin" || isDemo);
  const isVerifyRoute = location.pathname === "/app/verify" || location.pathname === "/verify";

  if (!isVerified) {
    return <VerifyEmailPage />;
  }

  if (isVerifyRoute && isVerified) {
    return <Navigate to="/app" replace />;
  }

  // 4. Role-based isolation: If user is an admin, strictly redirect to isolated /admin workspace
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // 5. Authenticated & Verified student: render student app layout
  return <Layout />;
}
