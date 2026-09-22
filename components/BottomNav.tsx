"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export default function BottomNav() {
  const { t } = useLang();
  const { session } = useAuth();
  const pathname = usePathname();

  const item = (href: string, icon: Parameters<typeof Icon>[0]["name"], label: string) => {
    const active = pathname === href;
    return (
      <Link href={href} className={`bnav-it${active ? " on" : ""}`} aria-label={label}>
        <Icon name={icon} size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="bnav" aria-label="Bottom">
      {item("/", "home", t("home"))}
      {item("/books", "book", t("library"))}
      <Link href="/write" className="bnav-plus" aria-label={t("writeStory")}>
        <Icon name="plusCircle" size={24} />
      </Link>
      {item("/categories", "grid", t("categories"))}
      <Link
        href={session ? "/account" : "/login"}
        className={`bnav-it${pathname === "/account" || pathname === "/login" ? " on" : ""}`}
        aria-label={t("account")}
      >
        {session?.writer.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.writer.avatar_url} alt="" className="bnav-ava" />
        ) : (
          <Icon name="user" size={20} />
        )}
        <span>{t("account")}</span>
      </Link>
    </nav>
  );
}
