import Link from "next/link";
import CoverImg from "@/components/CoverImg";
import Icon from "@/components/Icon";
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
    <Link href={`/book/${book.id}`} className="card book-card shelf">
      <span className="shelf-cover">
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
          <span
            className="cover cover-fallback"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, textAlign: "center" }}>{book.title}</span>
          </span>
        )}
        <span className="shelf-spine" aria-hidden="true" />
        <span className="shelf-sheen" aria-hidden="true" />
        {book.category ? <span className="shelf-cat">{book.category}</span> : null}
        <span className="shelf-stats" aria-hidden="true">
          <span>
            <Icon name="eye" size={11} /> {fmtCount(book.views ?? 0)}
          </span>
          <span>
            <Icon name="heart" size={11} /> {fmtCount(book.likes ?? 0)}
          </span>
        </span>
      </span>
      <span className="meta">
        <span className="title">{book.title}</span>
        <span className="author">{displayAuthor(book)}</span>
      </span>
    </Link>
  );
}
