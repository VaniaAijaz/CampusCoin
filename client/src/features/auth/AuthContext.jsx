import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../../core/api";

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

  // Validate session on mount
  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (data.success && isMounted) {
          setUser(data.user);
          localStorage.setItem("cc_user", JSON.stringify(data.user));
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("cc_token");
          localStorage.removeItem("cc_user");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
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
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
