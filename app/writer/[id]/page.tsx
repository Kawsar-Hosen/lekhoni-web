import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookCard, { fmtCount } from "@/components/BookCard";
import VerifiedBadge from "@/components/VerifiedBadge";
import { FollowButton } from "@/components/Engage";
import { getWriter, getWriters, getBooks } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

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
  const lang = await getLang();
  const t = dict[lang];
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
      <div
        className="card wmag-head"
        style={mine[0]?.cover_url ? { backgroundImage: `url(${mine[0].cover_url})` } : undefined}
      >
        <div className="wmag-wash" />
        <div className="wmag-top">
          <div className="wmag-ava">
            {w.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.avatar_url} alt={w.writer_name} className="avatar" style={{ width: 72, height: 72 }} />
            ) : (
              <div className="avatar-fallback" style={{ width: 72, height: 72, fontSize: 26 }}>
                {w.writer_name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="wmag-id">
            <h1 className="wmag-name">
              {w.writer_name}
              <VerifiedBadge badge={w.badge} size={20} />
            </h1>
            <div className="wuser">@{w.username}</div>
          </div>
        </div>
        {w.bio && (
          <>
            <h3 className="wmag-h">{t.about}</h3>
            <p className="wbio wmag-bio">{w.bio}</p>
          </>
        )}
        <div className="wmag-inline-stats">
          <span><strong>{fmtCount(w.follower_count || 0)}</strong> {t.followers}</span>
          <i>·</i>
          <span><strong>{fmtCount(reads)}</strong> {t.totalReads}</span>
          <i>·</i>
          <span><strong>{mine.length}</strong> {t.publishedBooks}</span>
        </div>
        <div className="wmag-act">
          <FollowButton writerId={w.id} writerName={w.writer_name} />
        </div>
      </div>
      <div className="wmag-stories">
        <div className="wmag-main">
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>
              {lang === "bn"
                ? `${w.writer_name} (${mine.length}) ${t.storiesBy}`
                : `${t.storiesBy} ${w.writer_name} (${mine.length})`}
            </h2>
          </div>
          {mine.length ? (
            <div className="wmag-grid">
              {mine.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          ) : (
            <div className="empty">{t.noStories}</div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Link href="/writers" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14 }}>
          ← All writers
        </Link>
      </div>
    </div>
  );
}
