import { createContext, useContext, useState, useEffect } from "react";

/**
 * Normalized RGB palettes (0 - 1) for Iridescence WebGL Shader
 */
export const THEMES = {
  aurora: {
    id: "aurora",
    name: "Aurora Sapphire",
    color: [0.06, 0.23, 0.44],
    mode: "dark",
    accent: "#38BDF8",
  },
  silver: {
    id: "silver",
    name: "Silver Glaze", // White-labeled, zero third-party branding in UI
    color: [0.85, 0.88, 0.92],
    mode: "light",
    accent: "#64748B",
  },
  rose: {
    id: "rose",
    name: "Midnight Rose",
    color: [0.35, 0.05, 0.15],
    mode: "dark",
    accent: "#FB7185",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Wealth",
    color: [0.02, 0.47, 0.34],
    mode: "dark",
    accent: "#34D399",
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem("cc_theme_id");
    return THEMES[saved] ? saved : "aurora";
  });

  const activeTheme = THEMES[themeId] || THEMES.aurora;

  useEffect(() => {
    localStorage.setItem("cc_theme_id", themeId);
    const root = document.documentElement;

    if (activeTheme.mode === "light") {
      root.classList.add("theme-light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("theme-light");
      root.classList.add("dark");
    }
  }, [themeId, activeTheme]);

  const selectTheme = (id) => {
    if (THEMES[id]) setThemeId(id);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        activeTheme,
        color: activeTheme.color,
        selectTheme,
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
