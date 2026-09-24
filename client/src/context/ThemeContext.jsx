import { createContext, useContext, useState, useEffect } from "react";

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

  return (
    <ThemeContext.Provider value={{ theme, fontSize, toggleTheme, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
