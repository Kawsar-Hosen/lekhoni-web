import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReaderControls from "./ReaderControls";
import ReadProgress from "./ReadProgress";
import TrackView from "@/components/TrackView";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getBook, displayAuthor } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 1800;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}): Promise<Metadata> {
  const { id, chapter } = await params;
  const b = await getBook(id);
  if (!b) return { title: "Chapter not found" };
  const idx = parseInt(chapter, 10) || 0;
  const c = (b.chapters || [])[idx];
  const title = c ? `${c.title} — ${b.title}` : b.title;
  return {
    title,
    description: `Read ${title} by ${displayAuthor(b)} online on Lekhoni Kahini.`,
    alternates: { canonical: `/read/${id}/${idx}` },
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter } = await params;
  const lang = await getLang();
  const t = dict[lang];
  const b = await getBook(id);
  if (!b) notFound();
  const idx = Math.max(0, parseInt(chapter, 10) || 0);
  const chs = b.chapters || [];
  const c = chs[idx];
  if (!c) notFound();

  const paragraphs = c.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="narrow">
      <Breadcrumbs trail={[{ name: "Home", url: "/" }, { name: b.title, url: `/book/${b.id}` }, { name: c.title, url: `/read/${id}/${idx}` }]} />
      <TrackView bookId={b.id} />
      <ReadProgress />
      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <Link href={`/book/${b.id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
          {b.title}
        </Link>
        <h1 style={{ margin: "6px 0 2px", fontSize: 24 }}>{c.title}</h1>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {t.chapterWord} {idx + 1} {t.ofWord} {chs.length} · ~{c.minutes || 5} {t.minRead}
        </div>
      </div>
      <ReaderControls bookId={b.id} bookTitle={b.title} index={idx} total={chs.length} />
      <article className="reader" style={{ marginTop: 20 }}>
        {paragraphs.length ? (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p>{c.body}</p>
        )}
      </article>
      <div style={{ height: 90 }} />
    </div>
  );
}
