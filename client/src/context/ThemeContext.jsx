import { createContext, useContext, useState, useEffect } from "react";

// Iridescence color palettes per theme (normalised RGB 0-1)
export const IRIDESCENCE_PALETTES = {
  light:  { c1:[0.18,0.12,0.45], c2:[0.05,0.42,0.62], c3:[0.62,0.08,0.38] },
  dark:   { c1:[0.06,0.06,0.18], c2:[0.02,0.18,0.32], c3:[0.28,0.02,0.18] },
  green:  { c1:[0.04,0.28,0.18], c2:[0.08,0.48,0.22], c3:[0.04,0.36,0.32] },
  ocean:  { c1:[0.02,0.18,0.48], c2:[0.08,0.38,0.68], c3:[0.02,0.28,0.52] },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("cc_theme") || "light");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("cc_fontsize") || "medium");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("cc_theme", theme);
  }, [theme]);

  useEffect(() => {
    const sizeMap = { small: "13px", medium: "14px", large: "16px" };
    document.documentElement.style.fontSize = sizeMap[fontSize] || "14px";
    localStorage.setItem("cc_fontsize", fontSize);
  }, [fontSize]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const palette = IRIDESCENCE_PALETTES[theme] || IRIDESCENCE_PALETTES.light;

  return (
    <ThemeContext.Provider value={{ theme, fontSize, toggleTheme, setFontSize, palette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
