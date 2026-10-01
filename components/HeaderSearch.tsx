"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getBooks, getWriters, bid, type ApiBook, type ApiWriter } from "@/lib/api";
import { useLang } from "@/lib/i18n";

let cache: { books: ApiBook[]; writers: ApiWriter[] } | null = null;

export default function HeaderSearch({ mobile }: { mobile?: boolean }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [data, setData] = useState<{ books: ApiBook[]; writers: ApiWriter[] }>(() => cache ?? { books: [], writers: [] });
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(q.trim().toLowerCase()), 180);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!debounced || cache) return;
    let on = true;
    Promise.all([getBooks(), getWriters()]).then(([b, w]) => {
      if (!on) return;
      cache = { books: b || [], writers: w || [] };
      setData(cache);
    });
    return () => {
      on = false;
    };
  }, [debounced]);

  const hits = useMemo(() => {
    if (!debounced) return null;
    const bh = data.books
      .filter((b) => `${b.title} ${b.author} ${b.author_name || ""}`.toLowerCase().includes(debounced))
      .slice(0, 5);
    const wh = data.writers
      .filter((w) => `${w.writer_name} ${w.username || ""}`.toLowerCase().includes(debounced))
      .slice(0, 3);
    return { bh, wh };
  }, [debounced, data]);

  const show = focus && hits && hits.bh.length + hits.wh.length > 0;

  return (
    <form
      className={mobile ? "header-search-mobile" : "header-search"}
      action="/search"
      method="get"
      role="search"
    >
      <div className="box" style={{ position: "relative" }}>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => window.setTimeout(() => setFocus(false), 150)}
          placeholder={t("searchPh")}
          aria-label={t("search")}
          autoComplete="off"
        />
        <button type="submit" aria-label={t("search")}>
          <Icon name="search" size={16} />
        </button>
        {show && (
          <div className="hsearch-drop">
            {hits.bh.map((b) => (
              <Link key={b.id} href={`/book/${bid(b)}`} className="hsearch-row">
                {b.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover_url} alt="" loading="lazy" />
                ) : (
                  <span className="hsearch-fb">{b.title[0]}</span>
                )}
                <span className="hsearch-info">
                  <span className="hsearch-t">{b.title}</span>
                  <span className="hsearch-s">{b.author_name || b.author}</span>
                </span>
              </Link>
            ))}
            {hits.wh.map((w) => (
              <Link key={w.id} href={`/writer/${w.id}`} className="hsearch-row">
                {w.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.avatar_url} alt="" loading="lazy" className="round" />
                ) : (
                  <span className="hsearch-fb round">{w.writer_name[0]?.toUpperCase()}</span>
                )}
                <span className="hsearch-info">
                  <span className="hsearch-t">
                    {w.writer_name} <VerifiedBadge badge={w.badge} size={13} />
                  </span>
                  <span className="hsearch-s">@{w.username}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
