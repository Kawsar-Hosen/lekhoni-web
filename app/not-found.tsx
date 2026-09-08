import Link from "next/link";
import Icon from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="narrow">
      <div className="empty" style={{ padding: "80px 16px" }}>
        <div style={{ color: "var(--muted)" }}>
          <Icon name="book" size={44} />
        </div>
        <h1 style={{ fontSize: 22 }}>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link className="btn" href="/" style={{ marginTop: 12 }}>
          Go home
        </Link>
      </div>
    </div>
  );
}
