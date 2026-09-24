import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: "500",
                borderRadius: "10px",
                border: "1px solid #E4E5E6",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                color: "#29292E",
                background: "#FFFFFF",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#16A34A", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#DC2626", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
