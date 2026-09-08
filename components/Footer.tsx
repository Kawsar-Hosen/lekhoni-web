"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import Icon from "@/components/Icon";

export default function Footer() {
  const { t } = useLang();
  const { session } = useAuth();

  return (
    <footer className="site-footer">
      <div className="inner">
        <div className="foot-box foot-single">
          <div className="foot-brandrow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/banner.png" alt="লেখনী কাহিনী" className="foot-banner" />
            <p className="foot-tag">{t("tagline")}</p>
            <div className="foot-mini">
              <Link href="/about">{t("about")}</Link>
              <span>·</span>
              <Link href="/contact">{t("contact")}</Link>
            </div>
          </div>
          <nav className="foot-cols" aria-label={`${t("explore")} ${t("legal")}`}>
            <div>
              <h4>{t("explore")}</h4>
              <Link href="/books">{t("books")}</Link>
              <Link href="/categories">{t("categories")}</Link>
              <Link href="/writers">{t("writers")}</Link>
            </div>
            <div>
              <h4>{t("legal")}</h4>
              <Link href="/privacy">{t("privacy")}</Link>
              <Link href="/delete-request">{t("deleteData")}</Link>
              <a href="https://lekhoni-terms.pages.dev/privacy" target="_blank" rel="noreferrer">
                Privacy (official)
              </a>
            </div>
          </nav>
        </div>
      </div>
      <div className="base">
        <Link href={session ? "/account" : "/login"} aria-label={t("account")} className="foot-acct">
          {session?.writer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.writer.avatar_url} alt="" width={18} height={18} style={{ borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <Icon name="user" size={16} />
          )}
        </Link>
        <span>© 2026 Lekhoni Kahini · lekhoni-kahini@xyteee.com</span>
      </div>
    </footer>
  );
}
