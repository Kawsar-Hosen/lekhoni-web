"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { dict, LANG_COOKIE, type DictKey, type Lang } from "./dict";

export type { DictKey, Lang };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict.en[k] ?? k,
});

function writeCookie(l: Lang) {
  try {
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {}
}

export function LanguageProvider({ children, initial }: { children: ReactNode; initial: Lang }) {
  // English default. No auto-detect — explicit choice only, persisted.
  // Initial value comes from the server (cookie); no hydration flash.
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("lk-lang", l);
    } catch {}
    writeCookie(l);
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] ?? k }}>
      <span data-lang={lang} style={{ display: "contents" }}>
        {children}
      </span>
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
