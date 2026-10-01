import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import Icon from "@/components/Icon";
import VerifiedBadge from "@/components/VerifiedBadge";
import Comments from "@/components/Comments";
import { LikeButton, FollowButton } from "@/components/Engage";
import BookShare from "@/components/BookShare";
import ChapterRows from "@/components/ChapterRows";
import TrackView from "@/components/TrackView";
import Breadcrumbs from "@/components/Breadcrumbs";
import { fmtCount } from "@/components/BookCard";
import { getBook, getBooks, getWriters, displayAuthor } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 1800;

export async function generateStaticParams() {
  const books = (await getBooks()) || [];
  return books.map((b) => ({ id: b.short_id || b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const b = await getBook(id);
  if (!b) return { title: "Book not found" };
  const desc = (b.description || "").slice(0, 160) || `${b.title} by ${displayAuthor(b)} — read online on Lekhoni Kahini.`;
  return {
    title: b.title,
    description: desc,
    alternates: { canonical: `/book/${b.short_id || b.id}` },
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
  const urlId = book.short_id || book.id;

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
      <TrackView bookId={urlId} />
      {/* Top bar: back + like + share (design file style) */}
      <div className="bk-top">
        <Link href="/books" className="icon-plain" aria-label={t.backBtn}>
          <Icon name="chevL" size={22} />
        </Link>
        <div className="bk-top-acts">
          <LikeButton bookId={urlId} initialLikes={book.likes} />
          <BookShare title={book.title} />
        </div>
      </div>

      {/* Centered hero: cover, genre, title, author, stats */}
      <div className="bk-hero">
        {book.cover_url && (
          <Image
            src={book.cover_url}
            alt={book.title}
            width={440}
            height={660}
            className="bk-cover"
            priority
            sizes="160px"
          />
        )}
        {book.category && (
          <Link
            href={`/books?category=${encodeURIComponent(book.category)}`}
            className="bk-genre"
          >
            {book.category}
          </Link>
        )}
        <h1 className="bk-title">{book.title}</h1>
        <div className="bk-author">
          {lang === "bn" ? "লেখক: " : ""}
          {writer ? (
            <Link href={`/writer/${writer.id}`} style={{ fontWeight: 700 }}>
              {displayAuthor(book)}
            </Link>
          ) : (
            displayAuthor(book)
          )}
          {writer && <VerifiedBadge badge={writer.badge} size={14} />}
        </div>
        <div className="bk-stats">
          <span>
            <Icon name="eye" size={13} /> {fmtCount(book.views)}
          </span>
          {!isPdf && (
            <span>
              <Icon name="bookOpen" size={13} />{" "}
              {isSingle ? `1 ${t.episodes}` : `${chs.length} ${t.episodes}`}
            </span>
          )}
          <span>
            <Icon name="heart" size={13} /> {fmtCount(book.likes)}
          </span>
        </div>
      </div>

      {/* Read actions */}
      <div className="bk-btns">
        {isPdf ? (
          <Link className="btn btn-premium bk-read" href={book.pdf_url as string} target="_blank" rel="noreferrer">
            <Icon name="bookOpen" size={17} /> {t.openPdf}
          </Link>
        ) : chs.length ? (
          <Link className="btn btn-premium bk-read" href={`/read/${book.id}/0`}>
            <Icon name="bookOpen" size={17} /> {isSingle ? t.readNow : t.startReading}
          </Link>
        ) : null}
      </div>

      {/* About + author card */}
      <div className="card bk-card">
        {book.dedication && <div className="bk-ded">{book.dedication}</div>}
        {book.description && (
          <>
            <h2 className="bk-sec">{t.description}</h2>
            <p className="bk-desc">{book.description}</p>
          </>
        )}
        <div className="bk-div" />
        <div className="bk-author-row">
          {writer?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={writer.avatar_url} alt={displayAuthor(book)} className="bk-ava" />
          ) : (
            <span className="bk-ava-fb">{displayAuthor(book)[0]?.toUpperCase()}</span>
          )}
          <span className="bk-author-tx">
            <strong>
              {writer ? (
                <Link href={`/writer/${writer.id}`}>{displayAuthor(book)}</Link>
              ) : (
                displayAuthor(book)
              )}
            </strong>
            <span>{t.moreFromWriter}</span>
          </span>
          <FollowButton writerId={writer?.id || null} writerName={displayAuthor(book)} />
        </div>
      </div>

      <AdSlot slot="book-detail" />

      {!isPdf && !isSingle && chs.length > 0 && (
        <section className="section narrow" style={{ marginLeft: 0 }}>
          <div className="section-head">
            <h2>{t.chapters} ({chs.length})</h2>
          </div>
          <ChapterRows bookId={urlId} count={chs.length} />
        </section>
      )}

      <div className="narrow" style={{ marginLeft: 0 }}>
        <Comments bookId={urlId} />
      </div>
    </div>
  );
}
