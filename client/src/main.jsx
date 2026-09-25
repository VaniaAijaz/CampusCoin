import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { showFrostedErrorToast } from "./core/errorToast";
import "./index.css";

// Global @tanstack/react-query client with Enterprise Error Handling
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Respect opt-out flags for local query error states
      if (!query.meta?.suppressGlobalToast) {
        showFrostedErrorToast(error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Respect opt-out flags for local mutation error states
      if (!mutation.meta?.suppressGlobalToast) {
        showFrostedErrorToast(error);
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        // Do not retry 4xx operational errors (e.g. 401, 403, 404, 409)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: "500",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
                  color: "#FFFFFF",
                  background: "rgba(11, 13, 14, 0.85)",
                  backdropFilter: "blur(20px)",
                  padding: "12px 18px",
                },
                success: {
                  iconTheme: { primary: "#10B981", secondary: "#FFFFFF" },
                },
                error: {
                  iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
