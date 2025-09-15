"use client";
import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";
import { Switch } from "./ui/switch";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = theme === "dark";
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
  <Switch checked={isDark} onCheckedChange={(v: boolean) => setTheme(v ? "dark" : "light")} />
      <Moon className="h-4 w-4" />
    </div>
  );
}
