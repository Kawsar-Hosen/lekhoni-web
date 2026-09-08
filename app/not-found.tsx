import Link from "next/link";
import Icon from "@/components/Icon";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export default async function NotFound() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="narrow">
      <div className="empty" style={{ padding: "80px 16px" }}>
        <div style={{ color: "var(--muted)" }}>
          <Icon name="book" size={44} />
        </div>
        <h1 style={{ fontSize: 22 }}>{t.notFoundTitle}</h1>
        <p>{t.notFoundText}</p>
        <Link className="btn" href="/" style={{ marginTop: 12 }}>
          {t.goHome}
        </Link>
      </div>
    </div>
  );
}
