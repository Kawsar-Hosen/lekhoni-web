import Link from "next/link";
import type { Metadata } from "next";
import { fmtCount } from "@/components/BookCard";
import { getWriters } from "@/lib/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Writers",
  description: "Meet the writers of Lekhoni Kahini — follow your favourite authors.",
  alternates: { canonical: "/writers" },
};

export default async function WritersPage() {
  const writers = (await getWriters()) || [];
  const sorted = [...writers].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>Writers</h2>
        </div>
        {sorted.length ? (
          <div className="grid-writers">
            {sorted.map((w) => (
              <Link key={w.id} href={`/writer/${w.id}`} className="card writer-card">
                {w.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.avatar_url} alt={w.writer_name} className="avatar" loading="lazy" />
                ) : (
                  <div className="avatar-fallback">{w.writer_name[0]?.toUpperCase()}</div>
                )}
                <div className="wname">{w.writer_name}</div>
                <div className="wsub">
                  {fmtCount(w.follower_count || 0)} followers
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">No writers found.</div>
        )}
      </div>
    </div>
  );
}
