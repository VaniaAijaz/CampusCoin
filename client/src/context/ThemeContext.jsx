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
    accent: "#3B82F6",
    primary: "#3B82F6",
    hover: "#2563EB",
    glow: "rgba(59, 130, 246, 0.35)",
    mode: "dark",
  },
  green: {
    id: "green",
    name: "Green",
    color: [0.03, 0.38, 0.22],
    accent: "#10B981",
    primary: "#10B981",
    hover: "#059669",
    glow: "rgba(16, 185, 129, 0.35)",
    mode: "dark",
  },
  red: {
    id: "red",
    name: "Red",
    color: [0.45, 0.05, 0.08],
    accent: "#EF4444",
    primary: "#EF4444",
    hover: "#DC2626",
    glow: "rgba(239, 68, 68, 0.35)",
    mode: "dark",
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
    return saved === "light" ? "light" : "dark";
  });

  const activeTheme = THEMES[themeId] || THEMES.blue;

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
    root.style.setProperty("--theme-glow", activeTheme.glow);

    // Strictly apply Dark vs Light mode
    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.remove("dark");
      root.classList.add("theme-light");
    }
  }, [themeId, mode, activeTheme]);

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
        isDark: mode === "dark",
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
