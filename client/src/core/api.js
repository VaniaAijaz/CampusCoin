import axios from "axios";

// Unified API base URL with fallback to proxy route
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor: Attach JWT bearer token if available and intercept demo mode mutations
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cc_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if running in Demo Mode
    let isDemo = false;
    try {
      const user = JSON.parse(localStorage.getItem("cc_user") || "{}");
      isDemo = Boolean(user?.isDemo || token?.startsWith("demo-mock"));
    } catch {
      isDemo = false;
    }

    if (isDemo) {
      const method = (config.method || "get").toLowerCase();
      const url = config.url || "";
      const isAuthExempt = url.includes("/auth/login") ||
                           url.includes("/auth/register") ||
                           url.includes("/auth/verify-email") ||
                           url.includes("/users/heartbeat");

      // Intercept any data mutation attempt: POST, PUT, PATCH, DELETE
      if (["post", "put", "patch", "delete"].includes(method) && !isAuthExempt) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("campuscoin:demoBlocked", {
              detail: {
                message: "This is a demo environment. You can explore the UI freely, but data submission is disabled.",
              },
            })
          );
        }

        // Cancel network mutation cleanly
        return Promise.reject({
          isDemoBlock: true,
          message: "This is a demo environment. You can explore the UI freely, but data submission is disabled.",
          response: {
            status: 403,
            data: {
              success: false,
              message: "This is a demo environment. You can explore the UI freely, but data submission is disabled.",
            },
          },
        });
      }
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
      try {
        const cachedUser = JSON.parse(localStorage.getItem("cc_user") || "{}");
        const cachedToken = localStorage.getItem("cc_token") || localStorage.getItem("token") || "";
        
        // Never clear demo sessions
        if (cachedUser?.isDemo || cachedToken.startsWith("demo-mock")) {
          return Promise.reject(error);
        }
      } catch {
        // Continue
      }

      const isAuthRoute = window.location.pathname === "/login" ||
                          window.location.pathname === "/register" ||
                          window.location.pathname === "/" ||
                          window.location.pathname === "/demo";

      // Only clean expired token if we are inside the authenticated workspace
      if (!isAuthRoute && window.location.pathname.startsWith("/app")) {
        localStorage.removeItem("cc_token");
        localStorage.removeItem("cc_user");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
