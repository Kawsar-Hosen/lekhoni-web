import type { Metadata } from "next";
import BooksFilter from "./BooksFilter";
import { getBooks } from "@/lib/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All books",
  description: "Browse all Bengali books — filter by category, sort by newest or most popular.",
  alternates: { canonical: "/books" },
};

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const books = (await getBooks()) || [];
  const categories = [...new Set(books.map((b) => b.category || "").filter(Boolean))].sort();
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>Books</h2>
        </div>
        <BooksFilter books={books} categories={categories} initialCategory={sp.category || ""} />
      </div>
    </div>
  );
}
