"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme)) || null;
    const sysDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (sysDark ? "dark" : "light");
    setTheme(initial);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }
  }, [theme]);
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
