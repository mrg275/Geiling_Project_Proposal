"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "conviction-theme";
type Theme = "dark" | "light";

/** Dark is the default whatever the OS is set to; this switch overrides it and
 *  the choice is remembered per browser. The matching `data-theme` stamp is set
 *  by an inline script in the document head, before first paint, so there is no
 *  flash of the wrong theme. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setTheme(attr === "light" ? "light" : "dark");
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing or blocked storage: the choice just will not persist.
    }
  }

  return (
    <div className="themeseg" role="group" aria-label="Theme">
      <button
        type="button"
        aria-pressed={theme === "dark"}
        aria-label="Dark theme"
        title="Dark"
        onClick={() => choose("dark")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        aria-pressed={theme === "light"}
        aria-label="Light theme"
        title="Light"
        onClick={() => choose("light")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4.1" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M12 2.5v2.1M12 19.4v2.1M4.6 12H2.5M21.5 12h-2.1M6.6 6.6 5.1 5.1M18.9 18.9l-1.5-1.5M17.4 6.6l1.5-1.5M5.1 18.9l1.5-1.5" />
          </g>
        </svg>
      </button>
    </div>
  );
}
