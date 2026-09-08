import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookCard, { fmtCount } from "@/components/BookCard";
import { getWriter, getWriters, getBooks, displayAuthor } from "@/lib/api";

export const revalidate = 1800;

export async function generateStaticParams() {
  const writers = (await getWriters()) || [];
  return writers.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const w = await getWriter(id);
  if (!w) return { title: "Writer not found" };
  return {
    title: w.writer_name,
    description: w.bio || `Stories by ${w.writer_name} on Lekhoni Kahini.`,
    alternates: { canonical: `/writer/${w.id}` },
    openGraph: {
      title: w.writer_name,
      description: w.bio || `Stories by ${w.writer_name} on Lekhoni Kahini.`,
      ...(w.avatar_url ? { images: [{ url: w.avatar_url }] } : {}),
    },
  };
}

export default async function WriterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [w, books] = await Promise.all([getWriter(id), getBooks()]);
  if (!w) notFound();
  const mine = (books || []).filter(
    (b) => b.author === w.writer_name || (b.author_name && b.author_name === w.writer_name)
  );
  const reads = mine.reduce(
    (s, b) => s + (typeof b.views === "number" ? b.views : parseInt(String(b.views).replace(/[^0-9]/g, ""), 10) || 0),
    0
  );

  return (
    <div className="wrap">
      <div className="card" style={{ marginTop: 28, padding: 28, textAlign: "center" }}>
        {w.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={w.avatar_url} alt={w.writer_name} className="avatar" style={{ width: 96, height: 96 }} />
        ) : (
          <div className="avatar-fallback" style={{ width: 96, height: 96, fontSize: 36 }}>
            {w.writer_name[0]?.toUpperCase()}
          </div>
        )}
        <h1 style={{ margin: "12px 0 2px", fontSize: 26 }}>{w.writer_name}</h1>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>@{w.username}</div>
        {w.bio && <p style={{ maxWidth: 520, margin: "12px auto 0", fontSize: 14 }}>{w.bio}</p>}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{mine.length}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Published books</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{fmtCount(reads)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Total reads</div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{fmtCount(w.follower_count || 0)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Followers</div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>
            Stories by {w.writer_name} ({mine.length})
          </h2>
        </div>
        {mine.length ? (
          <div className="grid-books">
            {mine.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div className="empty">This writer has not published any stories yet. {displayAuthor({ author: w.writer_name, author_name: "" })}</div>
        )}
      </section>
      <div style={{ marginTop: 16 }}>
        <Link href="/writers" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
          ← All writers
        </Link>
      </div>
    </div>
  );
}
