import Link from "next/link";
import type { Metadata } from "next";
import { getBooks, getCategories } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "Categories",
    description: dict[lang].metaDesc,
    alternates: { canonical: "/categories" },
  };
}

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
        <div className="cat-grid-app">
          {(cats || []).map((c) => (
            <Link
              key={c.id}
              href={`/books?category=${encodeURIComponent(c.name)}`}
              className="cat-app"
            >
              <span className="cat-app-img">
                {c.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.cover_url} alt={c.name} loading="lazy" />
                ) : (
                  <span className="cat-app-fb" style={{ backgroundColor: c.color || "var(--accent-soft)" }}>
                    {c.name[0]}
                  </span>
                )}
                <span className="cat-app-name">{c.name}</span>
              </span>
              <span className="cat-app-badge">{counts[c.name] || 0} {t.booksCount}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
