"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const KEY = "lk-theme";

function storedTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const s = window.localStorage.getItem(KEY);
    if (s === "light" || s === "dark" || s === "system") return s;
  } catch {}
  return "system";
}

function subscribePrefersDark(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function snapshotPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const Ctx = createContext<{
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (t: Theme) => void;
}>({ theme: "system", resolved: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(storedTheme);
  const prefersDark = useSyncExternalStore(subscribePrefersDark, snapshotPrefersDark, () => false);
  const resolved: ResolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    try {
      document.documentElement.style.colorScheme = resolved;
    } catch {}
  }, [resolved]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(KEY, t);
    } catch {}
  }, []);

  return <Ctx.Provider value={{ theme, resolved, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
