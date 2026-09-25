import { useAuth } from "../features/auth/AuthContext";
import Layout from "../core/Layout";
import SplitAuthPage from "../features/auth/SplitAuthPage";
import LoadingScreen from "../components/ui/LoadingScreen";

export default function Gatekeeper() {
  const { isAuthenticated, isLoading, loading } = useAuth();
  const isAuthLoading = isLoading !== undefined ? isLoading : loading;

  // Strict Auth Gate: Do not render until auth state is definitively resolved
  if (isAuthLoading) {
    return <LoadingScreen message="Verifying Session..." />;
  }

  if (isAuthenticated) {
    return <Layout />;
  }

  return <SplitAuthPage defaultMode="login" />;
}
