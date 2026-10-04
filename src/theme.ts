import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "theme";

const systemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return systemDark() ? "dark" : "light";
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event("themechange"));
}

export function useTheme(): Theme {
  const [theme, set] = useState<Theme>(currentTheme);
  useEffect(() => {
    const sync = () => set(currentTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themechange", sync);
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("themechange", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);
  return theme;
}
