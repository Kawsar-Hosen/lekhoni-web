"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BookCard from "@/components/BookCard";
import { bookViews, type ApiBook } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type Props = { books: ApiBook[]; categories: string[]; initialCategory: string };

export default function BooksFilter({ books, categories, initialCategory }: Props) {
  const { t } = useLang();
  const [cat, setCat] = useState(initialCategory);
  const [sort, setSort] = useState<"new" | "popular">("new");

  const list = useMemo(() => {
    let l = cat ? books.filter((b) => (b.category || "") === cat) : [...books];
    l = [...l].sort((a, b) =>
      sort === "popular"
        ? bookViews(b) - bookViews(a)
        : String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
    );
    return l;
  }, [books, cat, sort]);

  return (
    <>
      <div className="toolbar">
        <select className="input" style={{ width: "auto" }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t("allCategories")}>
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as "new" | "popular")} aria-label="Sort">
          <option value="new">{t("newest")}</option>
          <option value="popular">{t("popular")}</option>
        </select>
      </div>
      {list.length ? (
        <div className="grid-books">
          {list.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="empty">
          {t("noBooks")} <Link href="/books" style={{ color: "var(--accent)", fontWeight: 700 }}>{t("browseAll")}</Link>
        </div>
      )}
    </>
  );
}
