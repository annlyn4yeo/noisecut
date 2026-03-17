"use client";

import {
  type MouseEvent,
  memo,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

type DocumentWithTransition = Document & {
  startViewTransition?: (callback: () => void) => void;
};

function ThemeToggleComponent() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    const storedTheme = localStorage.getItem("noisecut-theme");
    const nextTheme = storedTheme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  function applyTheme(nextTheme: Theme) {
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("noisecut-theme", nextTheme);
    setTheme(nextTheme);
  }

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const nextTheme = theme === "light" ? "dark" : "light";

    document.documentElement.style.setProperty("--reveal-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--reveal-y", `${event.clientY}px`);

    const documentWithTransition = document as DocumentWithTransition;

    if (!documentWithTransition.startViewTransition) {
      applyTheme(nextTheme);
      return;
    }

    documentWithTransition.startViewTransition(() => applyTheme(nextTheme));
  }

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-8 w-[58px] rounded-full border border-[var(--divider)] bg-[var(--surface)]"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-8 w-[58px] items-center rounded-full border border-[var(--divider)] bg-[var(--surface)] px-[4px]"
    >
      <span
        className={[
          "flex h-6 w-6 items-center justify-center rounded-full text-white transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          theme === "dark"
            ? "translate-x-[26px] bg-[#4d8eff]"
            : "translate-x-0 bg-[#1660F5]",
        ].join(" ")}
      >
        {theme === "dark" ? (
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.8 10.9A5.8 5.8 0 0 1 5.1 4.2a5.9 5.9 0 1 0 6.7 6.7Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            className="h-3 w-3"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8" cy="8" r="3" fill="currentColor" />
            <path
              d="M8 1.5v1.7M8 12.8v1.7M14.5 8h-1.7M3.2 8H1.5M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2M12.6 12.6l-1.2-1.2M4.6 4.6 3.4 3.4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

export const ThemeToggle = memo(ThemeToggleComponent);
