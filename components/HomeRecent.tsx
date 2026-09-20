"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import { getBooks, type ApiBook } from "@/lib/api";
import { getRecent } from "@/lib/recent";
import { useLang } from "@/lib/i18n";

export default function HomeRecent() {
  const { t } = useLang();
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ids = getRecent();
    if (!ids.length) {
      setReady(true);
      return;
    }
    getBooks().then((all) => {
      const map = new Map((all || []).map((b) => [b.id, b]));
      setBooks(ids.map((id) => map.get(id)).filter((b): b is ApiBook => Boolean(b)));
      setReady(true);
    });
  }, []);

  if (!ready || !books.length) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h2>{t("recentlyRead")}</h2>
        <Link href="/books">{t("viewAll")} →</Link>
      </div>
      <div className="rail home-rail">
        {books.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}
      </div>
    </section>
  );
}
