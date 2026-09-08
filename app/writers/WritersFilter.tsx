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
        <div className="wrank-list">
          {list.map((w, i) => (
            <div key={w.id} className="card wrank-row">
              <span className={`wrank-num${i < 3 ? ` top${i + 1}` : ""}`}>{i + 1}</span>
              <Link href={`/writer/${w.id}`} className={`wrank-ava ring${i < 3 ? i + 1 : ""}`}>
                {w.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.avatar_url} alt={w.writer_name} loading="lazy" />
                ) : (
                  <span className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</span>
                )}
              </Link>
              <Link href={`/writer/${w.id}`} className="wrank-info">
                <span className="wrank-name">
                  {w.writer_name}
                  <VerifiedBadge badge={w.badge} size={15} />
                </span>
                <span className="wrank-user">@{w.username}</span>
                {w.bio ? <span className="wrank-bio">{w.bio}</span> : null}
                <span className="wrank-stats">
                  {bookCounts[w.writer_name] ? `${bookCounts[w.writer_name]} ${t("books")}` : null}
                  {bookCounts[w.writer_name] ? " · " : ""}
                  {fmtCount(w.follower_count || 0)} {t("followers")}
                </span>
              </Link>
              <span className="wrank-act" onClick={(e) => e.stopPropagation()}>
                <FollowButton writerId={w.id} writerName={w.writer_name} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">{t("noResults")}</div>
      )}
    </>
  );
}
