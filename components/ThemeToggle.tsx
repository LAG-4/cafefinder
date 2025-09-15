"use client";
import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";
import { Switch } from "./ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";
  
  return (
    <div className="flex items-center gap-2">
      <Sun 
        className="h-4 w-4 transition-colors" 
        style={{ color: isDark ? 'var(--muted-foreground)' : '#eab308' }}
      />
      <Switch 
        checked={isDark} 
        onCheckedChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
      <Moon 
        className="h-4 w-4 transition-colors" 
        style={{ color: isDark ? '#60a5fa' : 'var(--muted-foreground)' }}
      />
    </div>
  );
}
