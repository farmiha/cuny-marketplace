import { createContext, useContext, useEffect, useState } from "react";
import { CAMPUS_THEMES } from "../data/campusThemes";

const CampusThemeContext = createContext(null);

export function CampusThemeProvider({ children }) {
  const [campus, setCampus] = useState("all");
  const [mode, setMode] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("cuny-market-mode");
    if (saved) return saved;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  const theme = CAMPUS_THEMES[campus] || CAMPUS_THEMES.all;

  // Push the active campus's colors onto CSS variables every time it changes.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-ink", theme.primaryInk);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-ink", theme.accentInk);
    root.style.setProperty("--hero-bg", theme.photo ? `url(${theme.photo})` : "none");
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    try {
      localStorage.setItem("cuny-market-mode", mode);
    } catch (e) {
      /* localStorage unavailable — ignore */
    }
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <CampusThemeContext.Provider value={{ campus, setCampus, theme, mode, setMode, toggleMode }}>
      {children}
    </CampusThemeContext.Provider>
  );
}

export function useCampusTheme() {
  const ctx = useContext(CampusThemeContext);
  if (!ctx) {
    throw new Error("useCampusTheme must be used inside a CampusThemeProvider");
  }
  return ctx;
}
