import axios from "axios";

// Unified API base URL with fallback to proxy route
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor: Attach JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Global 401 unauthorized session expiry handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = window.location.pathname === "/login" ||
                          window.location.pathname === "/register";
      // Only clear session and redirect when inside the app, not on auth pages
      if (!isAuthRoute) {
        localStorage.removeItem("cc_token");
        localStorage.removeItem("cc_user");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if currently inside /app
        if (window.location.pathname.startsWith("/app")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
