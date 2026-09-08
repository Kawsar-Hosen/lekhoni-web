"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="site-footer">
      <div className="inner">
        <div className="col">
          <h4>Lekhoni Kahini</h4>
          <Link href="/about">{t("about")}</Link>
          <Link href="/contact">{t("contact")}</Link>
        </div>
        <div className="col">
          <h4>{t("books")}</h4>
          <Link href="/books">{t("books")}</Link>
          <Link href="/categories">{t("categories")}</Link>
          <Link href="/writers">{t("writers")}</Link>
        </div>
        <div className="col">
          <h4>Legal</h4>
          <Link href="/privacy">{t("privacy")}</Link>
          <Link href="/delete-request">{t("deleteData")}</Link>
          <a href="https://lekhoni-terms.pages.dev/privacy" target="_blank" rel="noreferrer">
            Privacy (official)
          </a>
        </div>
      </div>
      <div className="base">© 2026 Lekhoni Kahini · lekhoni-kahini@xyteee.com</div>
    </footer>
  );
}
