import Link from "next/link";
import CoverImg from "@/components/CoverImg";
import { displayAuthor, type ApiBook } from "@/lib/api";

export function fmtCount(n: number | string): string {
  const v = typeof n === "number" ? n : parseInt(String(n).replace(/[^0-9]/g, ""), 10) || 0;
  if (v < 1000) return `${v}`;
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`.replace(".0k", "k");
  }
  const m = v / 1_000_000;
  return `${m >= 100 ? Math.round(m) : Math.round(m * 10) / 10}M`.replace(".0M", "M");
}

export default function BookCard({ book }: { book: ApiBook }) {
  return (
    <Link href={`/book/${book.id}`} className="card book-card">
      {book.cover_url ? (
        <CoverImg
          src={book.cover_url}
          alt={book.title}
          width={300}
          height={450}
          className="cover"
          sizes="(max-width: 640px) 33vw, (max-width: 900px) 25vw, 16vw"
        />
      ) : (
        <div className="cover cover-fallback" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 13, textAlign: "center" }}>{book.title}</span>
        </div>
      )}
      <div className="meta">
        <div className="title">{book.title}</div>
        <div className="author">{displayAuthor(book)}</div>
      </div>
    </Link>
  );
}
