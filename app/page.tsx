import Link from "next/link";
import type { Metadata } from "next";
import BookCard from "@/components/BookCard";
import NewBooks from "./NewBooks";
import HomeWriters from "@/components/HomeWriters";
import HomeRecent from "@/components/HomeRecent";
import AdSlot from "@/components/AdSlot";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";
import { getBooks, getCategories, getWriters, isNewBook, isPopularBook, bookViews } from "@/lib/api";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "Lekhoni Kahini — Bengali stories, novels & poems",
    description: dict[lang].metaDesc,
    alternates: { canonical: "/" },
  };
}

function SectionHead({ title, href, more }: { title: string; href: string; more: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      <Link href={href}>{more} →</Link>
    </div>
  );
}

export default async function HomePage() {
  const lang = await getLang();
  const t = dict[lang];
  const [books, categories, writers] = await Promise.all([
    getBooks(),
    getCategories(),
    getWriters(),
  ]);
  const all = books || [];
  const fresh = all
    .filter((b) => isNewBook(b))
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  const popular = all
    .filter((b) => isPopularBook(b))
    .sort((a, b) => bookViews(b) - bookViews(a))
    .slice(0, 12);
  const catCounts: Record<string, number> = {};
  for (const b of all) {
    const c = b.category || "";
    if (c) catCounts[c] = (catCounts[c] || 0) + 1;
  }
  const topCats = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => ({ name, books: all.filter((b) => (b.category || "") === name).slice(0, 6) }))
    .filter((c) => c.books.length > 0);

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <h1>{t.heroTitleA}<span className="hero-mark">{t.heroTitleHL}</span>{t.heroTitleB}</h1>
          <p>{t.heroSub}</p>
          <div className="actions">
            <p className="hero-note">{t.writeEarnA}<span className="earn-hl">{t.writeEarnHL}</span>{t.writeEarnB}</p>
            <Link className="btn btn-premium" href="/write">
              {t.startWriting}
            </Link>
          </div>
        </div>
      </section>

      {fresh.length > 0 && <NewBooks books={fresh} />}

      <AdSlot slot="home-feed" />

      {popular.length > 0 && (
        <section className="section">
          <SectionHead title={t.popularBooks} href="/books" more={t.viewAll} />
          <div className="grid-books">
            {popular.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <SectionHead title={t.categories} href="/categories" more={t.viewAll} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(categories || []).slice(0, 12).map((c) => (
            <Link key={c.id} href={`/books?category=${encodeURIComponent(c.name)}`} className="chip">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title={t.allWriters} href="/writers" more={t.viewAll} />
        <HomeWriters writers={writers || []} />
      </section>

      <HomeRecent />

      {topCats.length > 0 && topCats.map((c) => (
        <section className="section" key={c.name}>
          <SectionHead title={c.name} href={`/books?category=${encodeURIComponent(c.name)}`} more={t.viewAll} />
          <div className="rail home-rail">
            {c.books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      ))}

      <section className="section">
        <div className="dl-banner">
          <div className="dl-glow" aria-hidden="true" />
          <div className="dl-info">
            <span className="dl-kicker">Lekhoni Kahini · Android</span>
            <h2>{t.dlTitle}</h2>
            <p>{t.dlBlurbA}{t.dlBlurbHL}{t.dlBlurbB}</p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=com.lekhoni.kahini"
            target="_blank"
            rel="noreferrer"
            aria-label="Google Play"
            className="dl-badge"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/google-play-badge.png" alt="Get it on Google Play" height={56} />
          </a>
        </div>
      </section>
    </div>
  );
}
