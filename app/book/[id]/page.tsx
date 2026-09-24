import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import Icon from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import Comments from "@/components/Comments";
import { LikeButton } from "@/components/Engage";
import TrackView from "@/components/TrackView";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fmtCount } from "@/components/BookCard";
import { getBook, getBooks, getWriters, displayAuthor } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 1800;

export async function generateStaticParams() {
  const books = (await getBooks()) || [];
  return books.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const b = await getBook(id);
  if (!b) return { title: "Book not found" };
  const desc = (b.description || "").slice(0, 160) || `${b.title} by ${displayAuthor(b)} — read online on Lekhoni Kahini.`;
  return {
    title: b.title,
    description: desc,
    alternates: { canonical: `/book/${b.id}` },
    openGraph: {
      title: b.title,
      description: desc,
      type: "book",
      ...(b.cover_url ? { images: [{ url: b.cover_url }] } : {}),
    },
  };
}

function BookJsonLd({ book }: { book: NonNullable<Awaited<ReturnType<typeof getBook>>> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: displayAuthor(book) },
    ...(book.cover_url ? { image: book.cover_url } : {}),
    ...(book.description ? { description: book.description.slice(0, 500) } : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const t = dict[lang];
  const [book, writers] = await Promise.all([getBook(id), getWriters()]);
  if (!book) notFound();

  const RANK: Record<string, number> = { verified: 3, top: 2, popular: 1, none: 0 };
  const writer = (writers || [])
    .filter(
      (w) => w.writer_name === book.author || (book.author_name && w.writer_name === book.author_name)
    )
    .sort(
      (a, b) => (RANK[b.badge || "none"] ?? 0) - (RANK[a.badge || "none"] ?? 0)
    )[0];
  const chs = book.chapters || [];
  const isPdf = Boolean(book.pdf_url);
  const isComplete = (book.story_type || "") === "complete";
  const isSingle = !isPdf && (isComplete || chs.length === 1);

  return (
    <div className="wrap">
      <BookJsonLd book={book} />
      <Breadcrumbs trail={[{ name: "Home", url: "/" }, { name: t.books, url: "/books" }, { name: book.title, url: `/book/${book.id}` }]} />
      <TrackView bookId={book.id} />
      <div className="card book-hero">
        <div className="book-hero-side">
          {book.cover_url && (
            <div className="book-hero-cover-s">
              <Image
                src={book.cover_url}
                alt={book.title}
                width={440}
                height={660}
                className="cover"
                priority
                sizes="(max-width: 640px) 120px, 150px"
              />
            </div>
          )}
          <div className="book-hero-info-s">
            <h1 className="book-hero-title">{book.title}</h1>
            <div className="book-hero-author">
              <span className="author-chip">
                {writer?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={writer.avatar_url} alt={displayAuthor(book)} className="book-hero-ava" />
                ) : (
                  <span className="book-hero-ava-fb">{displayAuthor(book)[0]?.toUpperCase()}</span>
                )}
                {writer ? <Link href={`/writer/${writer.id}`} style={{ fontWeight: 700 }}>{displayAuthor(book)}</Link> : displayAuthor(book)}
                {writer && <VerifiedBadge badge={writer.badge} size={15} />}
              </span>
            </div>
            <div className="book-hero-tags">
              {book.category && (
                <Link href={`/books?category=${encodeURIComponent(book.category)}`} className="pill">
                  {book.category}
                </Link>
              )}
            {!isPdf && (
              <span className={`type-badge ${isComplete ? "t-complete" : "t-eps"}`}>{isComplete ? t.typeComplete : `${chs.length} ${t.episodes}`}</span>
            )}
            {isPdf && <span className="type-badge t-pdf">{t.pdfBook}</span>}
            </div>
            {book.dedication && (
              <div className="book-hero-ded">
                {book.dedication}
              </div>
            )}
          </div>
        </div>
        <div className="book-hero-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="eye" size={13} /> {fmtCount(book.views)} {t.views}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="heart" size={13} /> {fmtCount(book.likes)} {t.likes}</span>
          {!isPdf && !isSingle && <span>{chs.length} {t.chapters}</span>}
          {isPdf && <span>{t.pdfBook}</span>}
        </div>
        <div className="book-hero-actions">
          {isPdf ? (
            <Link className="btn" href={book.pdf_url as string} target="_blank" rel="noreferrer">
              {t.openPdf}
            </Link>
          ) : chs.length ? (
            <Link className="btn btn-premium" href={`/read/${book.id}/0`}>
              {isSingle ? t.readNow : t.startReading}
            </Link>
          ) : null}
          <LikeButton bookId={book.id} initialLikes={book.likes} />
        </div>
        {book.description && (
          <>
            <h2 className="book-hero-desc-h">{t.description}</h2>
            <p className="book-hero-desc">{book.description}</p>
          </>
        )}
      </div>

      <AdSlot slot="book-detail" />

      {!isPdf && !isSingle && chs.length > 0 && (
        <section className="section narrow" style={{ marginLeft: 0 }}>
          <div className="section-head">
            <h2>{t.chapters} ({chs.length})</h2>
          </div>
          <ol className="chapter-list">
            {chs.map((c, i) => (
              <li key={c.id}>
                <Link href={`/read/${book.id}/${i}`} style={{ width: "100%" }}>
                  <span className="n">{i + 1}</span>
                  <span>{i + 1} {t.episodes}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="narrow" style={{ marginLeft: 0 }}>
        <Comments bookId={book.id} />
      </div>
    </div>
  );
}
