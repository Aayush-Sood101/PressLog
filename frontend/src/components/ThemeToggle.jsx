"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1a355b] transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        <div className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1a355b] transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
