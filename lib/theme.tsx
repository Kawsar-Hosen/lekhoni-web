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

function subscribeStore(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function snapshotStore(): Theme {
  try {
    const s = window.localStorage.getItem(KEY);
    if (s === "light" || s === "dark" || s === "system") return s;
  } catch {}
  return "light";
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
}>({ theme: "light", resolved: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server snapshot is 'light' so hydration matches; client syncs after.
  const stored = useSyncExternalStore(subscribeStore, snapshotStore, (): Theme => "light");
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? stored;
  const prefersDark = useSyncExternalStore(subscribePrefersDark, snapshotPrefersDark, () => false);
  const resolved: ResolvedTheme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    try {
      document.documentElement.style.colorScheme = resolved;
    } catch {}
  }, [resolved]);

  const setTheme = useCallback((t: Theme) => {
    setOverride(t);
    try {
      window.localStorage.setItem(KEY, t);
    } catch {}
  }, []);

  return <Ctx.Provider value={{ theme, resolved, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
