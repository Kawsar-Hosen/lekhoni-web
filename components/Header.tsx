"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import HeaderSearch from "./HeaderSearch";
import ShareMenu from "./ShareMenu";
import { useLang, type DictKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
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
  const { session } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  const closeAll = () => {
    setThemeOpen(false);
    setAcctOpen(false);
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
              className="icon-btn"
              onClick={() => { closeAll(); setThemeOpen((v) => !v); }}
              title={t("theme")}
              aria-label={t("theme")}
              aria-expanded={themeOpen}
            >
              <Icon name={theme === "light" ? "sun" : theme === "dark" ? "moon" : "system"} size={16} />
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
          {session ? (
            <Link className="icon-btn" href="/account" title={session.writer.writer_name} aria-label={t("account")}>
              {session.writer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.writer.avatar_url} alt="" width={20} height={20} style={{ borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <Icon name="user" size={16} />
              )}
              <span className="hide-sm" style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.writer.writer_name}
              </span>
            </Link>
          ) : (
            <div style={{ position: "relative" }}>
              <button
                className="icon-btn"
                onClick={() => { closeAll(); setAcctOpen((v) => !v); }}
                title={t("account")}
                aria-label={t("account")}
                aria-expanded={acctOpen}
              >
                <Icon name="user" size={16} />
              </button>
              {acctOpen && (
                <>
                  <div
                    onClick={closeAll}
                    style={{ position: "fixed", inset: 0, zIndex: 60, cursor: "default" }}
                    aria-hidden="true"
                  />
                  <div className="card acct-menu">
                    <Link href="/login" onClick={closeAll}>
                      <Icon name="user" size={15} /> {t("signIn")}
                    </Link>
                    <Link href="/register" onClick={closeAll}>
                      <Icon name="userPlus" size={15} /> {t("signUp")}
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
          <button
            className="icon-btn menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <Icon name={open ? "x" : "menu"} size={16} />
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
          <div className="mnav-share">
            <ShareMenu onDone={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
