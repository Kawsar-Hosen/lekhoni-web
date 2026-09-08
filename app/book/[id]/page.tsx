import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import Comments from "@/components/Comments";
import { FollowButton, LikeButton } from "@/components/Engage";
import { fmtCount } from "@/components/BookCard";
import { getBook, getBooks, getWriters, displayAuthor } from "@/lib/api";

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
  const [book, writers] = await Promise.all([getBook(id), getWriters()]);
  if (!book) notFound();

  const writer = (writers || []).find(
    (w) => w.writer_name === book.author || (book.author_name && w.writer_name === book.author_name)
  );
  const chs = book.chapters || [];
  const isPdf = Boolean(book.pdf_url);

  return (
    <div className="wrap">
      <BookJsonLd book={book} />
      <div className="detail">
        <div>
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              width={440}
              height={587}
              className="cover"
              priority
              sizes="(max-width: 640px) 180px, 220px"
            />
          ) : null}
        </div>
        <div>
          {book.category && (
            <Link href={`/books?category=${encodeURIComponent(book.category)}`} className="pill">
              {book.category}
            </Link>
          )}
          <h1 style={{ margin: "10px 0 4px", fontSize: 28 }}>{book.title}</h1>
          <div style={{ color: "var(--muted)", fontSize: 14 }}>
            {writer ? <Link href={`/writer/${writer.id}`} style={{ fontWeight: 700 }}>{displayAuthor(book)}</Link> : displayAuthor(book)}
          </div>
          {book.dedication && (
            <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginTop: 6 }}>
              {book.dedication}
            </div>
          )}
          <div className="meta-row">
            <span>👁 {fmtCount(book.views)} views</span>
            <span>♥ {fmtCount(book.likes)} likes</span>
            {!isPdf && <span>{chs.length} chapters</span>}
            {isPdf && <span>PDF book</span>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            {isPdf ? (
              <Link className="btn" href={book.pdf_url as string} target="_blank" rel="noreferrer">
                Open PDF
              </Link>
            ) : chs.length ? (
              <Link className="btn" href={`/read/${book.id}/0`}>
                Start reading
              </Link>
            ) : null}
            <LikeButton bookId={book.id} initialLikes={book.likes} />
            <FollowButton writerId={writer ? writer.id : null} writerName={displayAuthor(book)} />
          </div>
          {book.description && (
            <>
              <h2 style={{ fontSize: 17, marginTop: 24 }}>Description</h2>
              <p style={{ color: "var(--ink)", fontSize: 15 }}>{book.description}</p>
            </>
          )}
        </div>
      </div>

      <AdSlot slot="book-detail" />

      {!isPdf && chs.length > 0 && (
        <section className="section narrow" style={{ marginLeft: 0 }}>
          <div className="section-head">
            <h2>Chapters ({chs.length})</h2>
          </div>
          <ol className="chapter-list">
            {chs.map((c, i) => (
              <li key={c.id}>
                <Link href={`/read/${book.id}/${i}`} style={{ width: "100%" }}>
                  <span className="n">{i + 1}</span>
                  <span>{c.title}</span>
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
