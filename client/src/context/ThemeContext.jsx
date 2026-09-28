import { createContext, useContext, useState, useEffect } from "react";

/**
 * Strict 3-Color Theme System: Red, Blue, Green
 * Mapped to CSS variables and theme glow while maintaining true glass transparency.
 */
export const THEMES = {
  blue: {
    id: "blue",
    name: "Blue",
    color: [0.05, 0.18, 0.42],
    accent: "#60A5FA",
    primary: "#3B82F6",
    primarySoft: "rgba(59, 130, 246, 0.15)",
    highlight: "#10B981",
    highlightFg: "#064e3b",
    hover: "#2563EB",
    glow: "rgba(59, 130, 246, 0.35)",
    swatch: "#3B82F6",
  },
  green: {
    id: "green",
    name: "Green",
    color: [0.03, 0.38, 0.22],
    accent: "#34D399",
    primary: "#10B981",
    primarySoft: "rgba(16, 185, 129, 0.15)",
    highlight: "#3B82F6",
    highlightFg: "#1e3a8a",
    hover: "#059669",
    glow: "rgba(16, 185, 129, 0.35)",
    swatch: "#10B981",
  },
  red: {
    id: "red",
    name: "Red",
    color: [0.45, 0.05, 0.08],
    accent: "#F87171",
    primary: "#EF4444",
    primarySoft: "rgba(239, 68, 68, 0.15)",
    highlight: "#F59E0B",
    highlightFg: "#78350f",
    hover: "#DC2626",
    glow: "rgba(239, 68, 68, 0.35)",
    swatch: "#EF4444",
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem("cc_theme_id");
    return THEMES[saved] ? saved : "blue";
  });

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("cc_theme_mode");
    return saved === "dark" ? "dark" : "light";
  });

  const activeTheme = THEMES[themeId] || THEMES.blue;
  const isDark = mode === "dark";

  const tokens = {
    hero: isDark ? "#0D0E15" : "#12141C",
    heroFg: "#FFFFFF",
    heroMuted: isDark ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.7)",
    heroLine: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)",
    brand: activeTheme.primary,
    brandSoft: activeTheme.primarySoft,
    brandHover: activeTheme.hover,
    highlight: activeTheme.highlight,
    highlightFg: isDark ? "#FFFFFF" : activeTheme.highlightFg,
    growth: "#10B981",
    growthSoft: isDark ? "rgba(16, 185, 129, 0.15)" : "#E6F4EA",
    background: isDark ? "#0A0B10" : "#F8F9FA",
    cardBg: isDark ? "#13151F" : "#FFFFFF",
    foreground: isDark ? "#F3F4F6" : "#111827",
    muted: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#232736" : "#E5E7EB",
    altBg: isDark ? "#1A1D2A" : "#F3F4F6",
    headerBg: isDark ? "rgba(13, 14, 21, 0.94)" : "rgba(255, 255, 255, 0.96)",
  };

  useEffect(() => {
    localStorage.setItem("cc_theme_id", themeId);
    localStorage.setItem("cc_theme_mode", mode);
    const root = document.documentElement;

    // Remove any previous theme classes and apply current theme
    root.classList.remove("theme-red", "theme-blue", "theme-green");
    root.classList.add(`theme-${themeId}`);
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-mode", mode);

    // Apply strict CSS variables dynamically
    root.style.setProperty("--color-brand-primary", activeTheme.primary);
    root.style.setProperty("--color-brand-hover", activeTheme.hover);
    root.style.setProperty("--color-brand-accent", activeTheme.accent);
    root.style.setProperty("--color-brand-soft", activeTheme.primarySoft);
    root.style.setProperty("--theme-glow", activeTheme.glow);
    root.style.setProperty("--app-bg", tokens.background);
    root.style.setProperty("--app-card-bg", tokens.cardBg);
    root.style.setProperty("--app-fg", tokens.foreground);
    root.style.setProperty("--app-muted", tokens.muted);
    root.style.setProperty("--app-border", tokens.border);
    root.style.setProperty("--app-alt-bg", tokens.altBg);
    root.style.setProperty("--app-header-bg", tokens.headerBg);

    // Strictly apply Dark vs Light mode
    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.remove("dark");
      root.classList.add("theme-light");
    }
  }, [themeId, mode, activeTheme, tokens]);

  const selectTheme = (id) => {
    if (THEMES[id]) setThemeId(id);
  };

  const toggleTheme = () => {
    const keys = ["blue", "green", "red"];
    const nextIdx = (keys.indexOf(themeId) + 1) % keys.length;
    setThemeId(keys[nextIdx]);
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme: themeId,
        activeTheme,
        color: activeTheme.color,
        mode,
        isDark,
        tokens,
        setMode,
        toggleMode,
        selectTheme,
        toggleTheme,
        themes: Object.values(THEMES),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export default ThemeContext;
