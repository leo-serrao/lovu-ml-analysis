"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function resolveActiveTheme(): Theme {
  const stored = document.documentElement.getAttribute("data-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // One-time read of DOM/localStorage state on mount -- server has no theme, so this can't be
    // computed during render without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolveActiveTheme());
  }, []);

  function toggle() {
    const next: Theme = resolveActiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("panel-theme", next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
    >
      {theme === null ? " " : theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
