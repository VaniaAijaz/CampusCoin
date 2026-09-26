import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../../core/api";

export const DEMO_STUDENT = {
  _id: "demo-student-id",
  name: "Alex Rivera",
  email: "student@campuscoin.com",
  role: "student",
  academicYear: "Junior (Year 3)",
  monthlyAllowanceBaseline: 1500,
  monthlySavingsGoal: 300,
  currency: "USD",
  isVerified: true,
  isDemo: true,
  isActive: true,
};

export const DEMO_ADMIN = {
  _id: "demo-admin-id",
  name: "Campus Coin Admin",
  email: "admin@campuscoin.com",
  role: "admin",
  isVerified: true,
  isDemo: true,
  isActive: true,
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cc_user") || localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("cc_token") || localStorage.getItem("token") || null
  );

  // Start as false if we already have cached user+token (instant load)
  const [loading, setLoading] = useState(() => {
    const t = localStorage.getItem("cc_token") || localStorage.getItem("token");
    const u = localStorage.getItem("cc_user") || localStorage.getItem("user");
    return !(t && u);
  });

  // Only run ONCE on mount — validate the initial token from localStorage
  const initialToken = useRef(
    localStorage.getItem("cc_token") || localStorage.getItem("token") || null
  );

  useEffect(() => {
    const storedToken = initialToken.current;

    if (!storedToken || storedToken.startsWith("demo-mock") || user?.isDemo) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    api.get("/auth/me")
      .then(({ data }) => {
        if (!cancelled && data.success) {
          setUser(data.user);
          localStorage.setItem("cc_user", JSON.stringify(data.user));
        }
      })
      .catch((err) => {
        if (!cancelled && err.response?.status === 401) {
          // Invalid token — clear everything
          setUser(null);
          setToken(null);
          ["cc_token","cc_user","token","user"].forEach(k => localStorage.removeItem(k));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []); // ← empty array: runs ONCE on mount only

  const enterDemoMode = useCallback((role = "student") => {
    const demoUser = role === "admin" ? DEMO_ADMIN : DEMO_STUDENT;
    setUser(demoUser);
    setToken("demo-mock-jwt-token");
    setLoading(false);
    localStorage.setItem("cc_token", "demo-mock-jwt-token");
    localStorage.setItem("cc_user", JSON.stringify(demoUser));
    return demoUser;
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setLoading(false);
    localStorage.setItem("cc_token", authToken);
    localStorage.setItem("cc_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setLoading(false);
    ["cc_token","cc_user","token","user"].forEach(k => localStorage.removeItem(k));
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem("cc_user", JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isLoading: loading,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === "admin",
      isDemo: Boolean(user?.isDemo || user?._id?.startsWith("demo")),
      enterDemoMode,
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
