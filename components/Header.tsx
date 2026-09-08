"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import type { DictKey } from "@/lib/i18n";

const NAV: { href: string; key: DictKey }[] = [
  { href: "/", key: "home" },
  { href: "/books", key: "books" },
  { href: "/categories", key: "categories" },
  { href: "/writers", key: "writers" },
  { href: "/search", key: "search" },
];

const THEME_ORDER: Theme[] = ["system", "light", "dark"];

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountNote, setAccountNote] = useState(false);

  const nextTheme = () => {
    const i = THEME_ORDER.indexOf(theme);
    setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
  };

  return (
    <header className="site-header">
      <div className="bar">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">ল</span>
          <span>Lekhoni Kahini</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname === n.href ? "active" : ""}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <button
            className="icon-btn"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            title={t("language")}
          >
            {lang === "en" ? "বাং" : "EN"}
          </button>
          <button className="icon-btn" onClick={nextTheme} title={t("theme")}>
            {theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐"}
          </button>
          <button className="icon-btn" onClick={() => setAccountNote((v) => !v)} title={t("account")}>
            👤
          </button>
          <button
            className="icon-btn menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {accountNote && (
        <div className="wrap" style={{ paddingBottom: 10 }}>
          <div className="card" style={{ padding: "10px 14px", fontSize: 13, color: "var(--muted)" }}>
            {t("accountSoon")}
          </div>
        </div>
      )}
      {open && (
        <nav className="mobile-nav" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {t(n.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
