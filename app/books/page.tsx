import type { Metadata } from "next";
import BooksFilter from "./BooksFilter";
import { getBooks } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "All books",
    description: dict[lang].metaDesc,
    alternates: { canonical: "/books" },
  };
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getLang();
  const t = dict[lang];
  const books = (await getBooks()) || [];
  const categories = [...new Set(books.map((b) => b.category || "").filter(Boolean))].sort();
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>{t.books}</h2>
        </div>
        <BooksFilter key={sp.category || "all"} books={books} categories={categories} initialCategory={sp.category || ""} />
      </div>
    </div>
  );
}
