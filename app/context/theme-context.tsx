"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface ThemeCtxValue {
  isDark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ow_theme");
    if (stored === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("ow_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("ow_theme", "light");
      }
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ isDark, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
