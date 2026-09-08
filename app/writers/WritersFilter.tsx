"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmtCount } from "@/components/BookCard";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { ApiWriter } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function WritersFilter({ writers }: { writers: ApiWriter[] }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sorted = [...writers].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
    if (!needle) return sorted;
    return sorted.filter((w) => `${w.writer_name} ${w.username || ""}`.toLowerCase().includes(needle));
  }, [writers, q]);

  return (
    <>
      <div className="toolbar">
        <input
          className="input"
          style={{ maxWidth: 260 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPh")}
          aria-label={t("search")}
        />
      </div>
      {list.length ? (
        <div className="grid-writers">
          {list.map((w) => (
            <Link key={w.id} href={`/writer/${w.id}`} className="card writer-card">
              {w.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.avatar_url} alt={w.writer_name} className="avatar" loading="lazy" />
              ) : (
                <div className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</div>
              )}
              <div className="wname" style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                {w.writer_name}
                <VerifiedBadge badge={w.badge} size={14} />
              </div>
              <div className="wsub">{fmtCount(w.follower_count || 0)} {t("followers")}</div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">{t("noResults")}</div>
      )}
    </>
  );
}
