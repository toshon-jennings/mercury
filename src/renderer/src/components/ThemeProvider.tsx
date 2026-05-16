import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolved: "dark",
  setTheme: () => {},
});

import { THEME_STORAGE_KEY as STORAGE_KEY } from "../constants";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolve(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
    return "system";
  });
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(theme));

  // Immediate sync of data-theme to prevent flash
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }

  // Listen for system theme updates from Electron
  useEffect(() => {
    const cleanup = window.hermesAPI.onSystemThemeUpdated((info) => {
      if (theme === "system") {
        setResolved(info.shouldUseDarkColors ? "dark" : "light");
      }
    });

    // Initial sync with actual native state if in system mode
    if (theme === "system") {
      window.hermesAPI.getSystemTheme().then((native) => {
        setResolved(native);
      });
    }

    return cleanup;
  }, [theme]);

  function setTheme(next: Theme): void {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  // Update resolved whenever theme changes
  useEffect(() => {
    setResolved(resolve(theme));
  }, [theme]);

  // Apply data-theme attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
