import Link from "next/link";
import { fmtCount } from "@/components/BookCard";
import CoverImg from "@/components/CoverImg";
import Icon from "@/components/Icon";
import MarqueeTitle from "@/components/MarqueeTitle";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getWriters, type ApiBook } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export default async function NewBooks({ books }: { books: ApiBook[] }) {
  const lang = await getLang();
  const t = dict[lang];
  const list = books.slice(0, 6);
  if (!list.length) return null;
  const writers = (await getWriters()) || [];
  const RANK: Record<string, number> = { verified: 3, top: 2, popular: 1, none: 0 };
  const wmap = new Map<string, (typeof writers)[number]>();
  for (const w of writers) {
    const prev = wmap.get(w.writer_name);
    if (!prev || (RANK[w.badge || "none"] ?? 0) > (RANK[prev.badge || "none"] ?? 0)) {
      wmap.set(w.writer_name, w);
    }
  }
  return (
    <section className="section">
      <div className="section-head">
        <h2>{t.newBooks}</h2>
        <Link href="/books">{t.viewAll} →</Link>
      </div>
      <div className="newbooks-grid">
        {list.map((b) => {
          const aname = b.author_name || b.author;
          const w = wmap.get(b.author_name || "") || wmap.get(b.author || "");
          const wlink = w ? `/writer/${w.id}` : `/search?q=${encodeURIComponent(aname)}`;
          return (
          <article key={b.id} className="card nb-card">
            <Link href={`/book/${b.id}`} className="nb-cover">
              {b.cover_url ? (
                <CoverImg
                  src={b.cover_url}
                  alt={b.title}
                  width={200}
                  height={300}
                  sizes="120px"
                />
              ) : (
                <span className="nb-fallback">{b.title[0]}</span>
              )}
            </Link>
            <div className="nb-info">
              <div className="nb-rows">
                <div className="nb-row">
                  <span className="nb-k">{t.bookLbl}:</span>
                  <Link href={`/book/${b.id}`} className="nb-title-link">
                    <MarqueeTitle text={b.title} />
                  </Link>
                </div>
                <div className="nb-row">
                  <span className="nb-k">{t.authorLbl}:</span>
                  <Link href={wlink} className="nb-v nb-link">
                    {aname}
                    {w?.badge ? <VerifiedBadge badge={w.badge} size={12} /> : null}
                  </Link>
                </div>
                <div className="nb-row">
                  <span className="nb-k">{t.typeLbl}:</span>
                  {b.category ? (
                    <Link href={`/books?category=${encodeURIComponent(b.category)}`} className="nb-v nb-link">
                      {b.category}
                    </Link>
                  ) : (
                    <span className="nb-v">—</span>
                  )}
                </div>
              </div>
              <div className="nb-meta">
                <span className="nb-views">
                  <Icon name="eye" size={12} /> {fmtCount(b.views)}
                </span>
                {(b.story_type || "") === "complete" ? (
                  <span className="nb-status2 st-on">{t.typeComplete}</span>
                ) : (b.writer_status || "") !== "complete" ? (
                  <span className="nb-status2 st-on2">{t.ongoingSt}</span>
                ) : null}
                {b.is_new && (
                  <span className="nb-status2 st-new">{t.newSt}</span>
                )}
              </div>
              <div className="nb-foot">
                <Link href={b.pdf_url ? `/book/${b.id}` : `/read/${b.id}/0`} className="btn nb-btn">
                  <Icon name="book" size={14} /> {t.readShort}
                </Link>
              </div>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}
