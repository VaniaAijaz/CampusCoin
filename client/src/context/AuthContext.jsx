import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cc_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("cc_token") || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get("/auth/me");
        if (data.success) {
          setUser(data.user);
          localStorage.setItem("cc_user", JSON.stringify(data.user));
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("cc_token", authToken);
    localStorage.setItem("cc_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("cc_user", JSON.stringify(updatedUser));
  }, []);

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
