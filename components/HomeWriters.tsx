"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import { fmtCount } from "@/components/BookCard";
import type { ApiWriter } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function HomeWriters({ writers }: { writers: ApiWriter[] }) {
  const { t } = useLang();
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const sorted = [...writers].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
    const needle = q.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((w) => `${w.writer_name} ${w.username || ""}`.toLowerCase().includes(needle));
  }, [writers, q]);

  return (
    <>
      <div className="writer-search" role="search">
        <Icon name="search" size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchByAuthor")}
          aria-label={t("searchByAuthor")}
          autoComplete="off"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 2 }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
      {list.length ? (
        <div className="rail writers-rail">
          {list.map((w) => (
            <Link key={w.id} href={`/writer/${w.id}`} className="card writer-card-new">
              <span className="writer-ava-new">
                {w.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.avatar_url} alt={w.writer_name} loading="lazy" />
                ) : (
                  <span className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</span>
                )}
              </span>
              <span className="wname-new">
                {w.writer_name}
                <VerifiedBadge badge={w.badge} size={14} />
              </span>
              <span className="wsub-new">{fmtCount(w.follower_count || 0)} {t("followers")}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">{t("noResults")}</div>
      )}
    </>
  );
}
