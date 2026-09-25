"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import HeaderSearch from "./HeaderSearch";
import ShareMenu from "./ShareMenu";
import { useLang, type DictKey } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";

const NAV: { href: string; key: DictKey }[] = [
  { href: "/", key: "home" },
  { href: "/books", key: "books" },
  { href: "/categories", key: "categories" },
  { href: "/writers", key: "writers" },
  { href: "/search", key: "search" },
];

export default function Header() {
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const closeAll = () => {
    setThemeOpen(false);
    setShareOpen(false);
  };

  return (
    <header className="site-header">
      <div className="bar">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/banner1.png" alt="লেখনী কাহিনী" className="brand-banner" />
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
        <HeaderSearch />
        <div className="header-right">
          <div style={{ position: "relative" }}>
            <button
              className="icon-plain"
              onClick={() => setThemeOpen((v) => !v)}
              title={t("theme")}
              aria-label={t("theme")}
              aria-expanded={themeOpen}
            >
              <Icon name={theme === "light" ? "sun" : theme === "dark" ? "moon" : "system"} size={18} />
            </button>
            {themeOpen && (
              <>
                <div
                  onClick={closeAll}
                  style={{ position: "fixed", inset: 0, zIndex: 60, cursor: "default" }}
                  aria-hidden="true"
                />
                <div className="card acct-menu more-menu">
                  <div className="menu-label">{t("theme")}</div>
                  {(["system", "light", "dark"] as Theme[]).map((m) => (
                    <button
                      key={m}
                      className={theme === m ? "menu-opt active" : "menu-opt"}
                      onClick={() => { setTheme(m); closeAll(); }}
                    >
                      <Icon name={m === "light" ? "sun" : m === "dark" ? "moon" : "system"} size={15} />
                      {t(m)} {theme === m && "✓"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button
              className="icon-plain"
              onClick={() => setShareOpen((v) => !v)}
              aria-label={t("shareVia")}
              aria-expanded={shareOpen}
            >
              <Icon name="share" size={18} />
            </button>
            {shareOpen && (
              <>
                <div
                  onClick={() => setShareOpen(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 60, cursor: "default" }}
                  aria-hidden="true"
                />
                <div className="card acct-menu more-menu share-drop">
                  <ShareMenu />
                </div>
              </>
            )}
          </div>
          <Link
            className="icon-plain ai-btn"
            aria-label="AI"
            title="AI"
            href="/ai"
          >
            <Icon name="ai" size={19} />
          </Link>
          <button
            className="icon-plain menu-btn menu-btn-lg"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>
      <HeaderSearch mobile />
      {open && (
        <nav className="mobile-nav" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {t(n.key)}
            </Link>
          ))}
          <Link href="/write" onClick={() => setOpen(false)}>
            {t("writeStory")}
          </Link>
          <div className="mnav-lang">
            <span className="mnav-lang-lb">
              <Icon name="globe" size={15} /> {t("language")}
            </span>
            <button
              className={`lang-switch${lang === "bn" ? " bn" : ""}`}
              onClick={() => {
                const next = lang === "en" ? "bn" : "en";
                setLang(next);
                setOpen(false);
                window.location.reload();
              }}
              aria-label={t("language")}
            >
              <span className="lang-knob" />
              <span className="lang-opt en">EN</span>
              <span className="lang-opt bn">বাং</span>
            </button>
          </div>
          <div className="mnav-row">
            <span className="mnav-lang-lb">
              <Icon name={theme === "light" ? "sun" : theme === "dark" ? "moon" : "system"} size={15} /> {t("theme")}
            </span>
            <div className="theme-seg">
              {(["light", "dark", "system"] as Theme[]).map((m) => (
                <button
                  key={m}
                  className={theme === m ? "on" : ""}
                  onClick={() => setTheme(m)}
                >
                  <Icon name={m === "light" ? "sun" : m === "dark" ? "moon" : "system"} size={14} />
                </button>
              ))}
            </div>
          </div>

        </nav>
      )}
    </header>
  );
}
