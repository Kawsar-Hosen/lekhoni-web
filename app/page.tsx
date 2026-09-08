import Link from "next/link";
import type { Metadata } from "next";
import BookCard, { fmtCount } from "@/components/BookCard";
import AdSlot from "@/components/AdSlot";
import { getBooks, getChapters, getCategories, getWriters, chaptersByBook, displayAuthor, bookViews } from "@/lib/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Lekhoni Kahini — Bengali stories, novels & poems",
  description: "Read Bengali books online — new episodes, timeless novels, and fresh voices.",
  alternates: { canonical: "/" },
};

function SectionHead({ title, href, more }: { title: string; href: string; more: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <Link href={href}>{more} →</Link>
    </div>
  );
}

export default async function HomePage() {
  const [books, chapters, categories, writers] = await Promise.all([
    getBooks(),
    getChapters(),
    getCategories(),
    getWriters(),
  ]);
  const all = books || [];
  const byId = chaptersByBook(chapters || []);
  const withChapters = (id: string) => byId[id] || [];

  const featured = all.find((b) => b.featured) || all[0];
  const fresh = [...all].sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || ""))).slice(0, 12);
  const popular = [...all].sort((a, b) => bookViews(b) - bookViews(a)).slice(0, 12);
  const topWriters = [...(writers || [])].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 8);

  return (
    <div className="wrap">
      {featured && (
        <section className="hero">
          <div>
            <span className="pill">Featured book</span>
            <h1 style={{ marginTop: 10 }}>{featured.title}</h1>
            <p>
              {displayAuthor(featured)} · {featured.category || ""} · {fmtCount(featured.views)} views
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link className="btn" href={featured.pdf_url ? `/book/${featured.id}` : withChapters(featured.id).length ? `/read/${featured.id}/0` : `/book/${featured.id}`}>
                Read now
              </Link>
              <Link className="btn btn-ghost" href={`/book/${featured.id}`}>
                Details
              </Link>
            </div>
          </div>
          <div>
            {featured.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.cover_url} alt={featured.title} className="cover" loading="eager" />
            ) : null}
          </div>
        </section>
      )}

      <section className="section">
        <SectionHead title="New books" href="/books" more="View all" />
        <div className="grid-books">
          {fresh.slice(0, 6).map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>

      <AdSlot slot="home-feed" />

      <section className="section">
        <SectionHead title="Popular books" href="/books" more="View all" />
        <div className="grid-books">
          {popular.slice(0, 6).map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Categories" href="/categories" more="View all" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(categories || []).slice(0, 12).map((c) => (
            <Link key={c.id} href={`/books?category=${encodeURIComponent(c.name)}`} className="pill" style={{ fontSize: 13, padding: "8px 14px" }}>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Popular writers" href="/writers" more="View all" />
        <div className="grid-writers">
          {topWriters.slice(0, 4).map((w) => (
            <Link key={w.id} href={`/writer/${w.id}`} className="card writer-card">
              {w.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.avatar_url} alt={w.writer_name} className="avatar" loading="lazy" />
              ) : (
                <div className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</div>
              )}
              <div style={{ fontWeight: 700, marginTop: 8 }}>{w.writer_name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtCount(w.follower_count || 0)} followers</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px" }}>Love to write?</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
            Publish your own stories with Writer Studio in the Lekhoni Kahini app.
          </p>
          <Link className="btn" href="/about">
            Get the app
          </Link>
        </div>
      </section>
    </div>
  );
}
