"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import { getBooks, getWriters, getCategories, type ApiBook, type ApiWriter, type ApiCategory } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function SearchClient({ initialQ = "" }: { initialQ?: string }) {
  const { t } = useLang();
  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState("");
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [writers, setWriters] = useState<ApiWriter[]>([]);
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    Promise.all([getBooks(), getWriters(), getCategories()]).then(([b, w, c]) => {
      if (!on) return;
      setBooks(b || []);
      setWriters(w || []);
      setCats(c || []);
      setReady(true);
    });
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(q.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const bookHits = useMemo(() => {
    if (!debounced) return [];
    return books
      .filter((b) => `${b.title} ${b.author} ${b.author_name || ""} ${b.category || ""}`.toLowerCase().includes(debounced))
      .slice(0, 24);
  }, [books, debounced]);

  const writerHits = useMemo(() => {
    if (!debounced) return [];
    return writers
      .filter((w) => `${w.writer_name} ${w.username || ""}`.toLowerCase().includes(debounced))
      .slice(0, 12);
  }, [writers, debounced]);

  const catHits = useMemo(() => {
    if (!debounced) return [];
    return cats.filter((c) => c.name.toLowerCase().includes(debounced)).slice(0, 12);
  }, [cats, debounced]);

  const searched = debounced.length > 0;

  return (
    <>
      <input
        className="input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPh")}
        aria-label={t("search")}
        autoFocus
        style={{ maxWidth: 520 }}
      />
      {!ready ? (
        <div className="empty">…</div>
      ) : !searched ? null : bookHits.length + writerHits.length + catHits.length === 0 ? (
        <div className="empty">{t("noResults")}</div>
      ) : (
        <>
          {writerHits.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>{t("writers")}</h2>
              </div>
              <div className="grid-writers">
                {writerHits.map((w) => (
                  <Link key={w.id} href={`/writer/${w.id}`} className="card writer-card">
                    {w.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.avatar_url} alt={w.writer_name} className="avatar" loading="lazy" />
                    ) : (
                      <div className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</div>
                    )}
                    <div className="wname">{w.writer_name}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {catHits.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>{t("categories")}</h2>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {catHits.map((c) => (
                  <Link key={c.id} href={`/books?category=${encodeURIComponent(c.name)}`} className="chip">
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {bookHits.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>
                  {t("books")} ({bookHits.length})
                </h2>
              </div>
              <div className="grid-books">
                {bookHits.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
