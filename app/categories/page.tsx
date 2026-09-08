import Link from "next/link";
import type { Metadata } from "next";
import { getBooks, getCategories } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Bengali books by category.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const lang = await getLang();
  const t = dict[lang];
  const [cats, books] = await Promise.all([getCategories(), getBooks()]);
  const counts: Record<string, number> = {};
  for (const b of books || []) {
    const c = b.category || "";
    if (c) counts[c] = (counts[c] || 0) + 1;
  }
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>{t.categories}</h2>
        </div>
        <div className="grid-writers">
          {(cats || []).map((c) => (
            <Link
              key={c.id}
              href={`/books?category=${encodeURIComponent(c.name)}`}
              className="card"
              style={{ padding: 20, display: "flex", alignItems: "center", gap: 12 }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: c.color || "var(--accent-soft)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span>
                <span style={{ display: "block", fontWeight: 700 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{counts[c.name] || 0} {t.booksCount}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
