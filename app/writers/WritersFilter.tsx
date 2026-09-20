"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fmtCount } from "@/components/BookCard";
import VerifiedBadge from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/Engage";
import type { ApiWriter } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function WritersFilter({ writers, bookCounts = {} }: { writers: ApiWriter[]; bookCounts?: Record<string, number> }) {
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
        <div className="wall-grid">
          {list.map((w) => (
            <div key={w.id} className="card wall-card">
              <Link href={`/writer/${w.id}`} className="wall-top">
                <span className="wall-ava">
                  {w.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.avatar_url} alt={w.writer_name} loading="lazy" />
                  ) : (
                    <span className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</span>
                  )}
                </span>
                <span className="wall-id">
                  <span className="wall-name">
                    {w.writer_name}
                    <VerifiedBadge badge={w.badge} size={14} />
                  </span>
                  <span className="wrank-user">@{w.username}</span>
                  {w.bio ? <span className="wrank-bio">{w.bio}</span> : null}
                </span>
              </Link>
              <div className="wall-foot">
                <span className="wrank-stats">
                  {bookCounts[w.writer_name] ? `${bookCounts[w.writer_name]} ${t("books")} · ` : ""}
                  {fmtCount(w.follower_count || 0)} {t("followers")}
                </span>
                <FollowButton writerId={w.id} writerName={w.writer_name} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">{t("noResults")}</div>
      )}
    </>
  );
}
