import type { Metadata } from "next";
import WritersFilter from "./WritersFilter";
import { getWriters, getBooks } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "Writers",
    description: dict[lang].metaDesc,
    alternates: { canonical: "/writers" },
  };
}

export default async function WritersPage() {
  const lang = await getLang();
  const t = dict[lang];
  const writers = (await getWriters()) || [];
  const books = (await getBooks()) || [];
  const counts: Record<string, number> = {};
  for (const b of books || []) {
    const key = b.author_name?.trim() || b.author;
    if (key) counts[key] = (counts[key] || 0) + 1;
  }
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>{t.writers}</h2>
        </div>
        <WritersFilter writers={writers} bookCounts={counts} />
      </div>
    </div>
  );
}
