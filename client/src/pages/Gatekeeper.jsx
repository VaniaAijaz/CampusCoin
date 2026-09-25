import { useAuth } from "../features/auth/AuthContext";
import Layout from "../core/Layout";
import SplitAuthPage from "../features/auth/SplitAuthPage";
import LoadingScreen from "../components/ui/LoadingScreen";

export default function Gatekeeper() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Layout />;
  }

  return <SplitAuthPage />;
}
