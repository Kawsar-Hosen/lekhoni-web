"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { verifyWriterToken, type WriterSession } from "./api";

const KEY = "lk-writer-session";

type Session = { writer: WriterSession; token: string } | null;

const Ctx = createContext<{
  session: Session;
  ready: boolean;
  signIn: (writer: WriterSession, token: string) => void;
  signOut: () => void;
}>({ session: null, ready: false, signIn: () => {}, signOut: () => {} });

function readStored(): { token: string } | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { token?: string };
    return p.token ? { token: p.token } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  // Rehydrate once on mount: stored token -> verify -> writer.
  useEffect(() => {
    let on = true;
    (async () => {
      const s = readStored();
      if (!s) {
        if (on) setReady(true);
        return;
      }
      const r = await verifyWriterToken(s.token);
      if (!on) return;
      if (r.data && "writer" in r.data) setSession({ writer: r.data.writer, token: s.token });
      else {
        try {
          window.localStorage.removeItem(KEY);
        } catch {}
      }
      setReady(true);
    })();
    return () => {
      on = false;
    };
  }, []);

  const signIn = useCallback((writer: WriterSession, token: string) => {
    setSession({ writer, token });
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ token }));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return <Ctx.Provider value={{ session, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
