"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { fetchMyStories, type WriterStory } from "@/lib/api";

export default function AccountClient() {
  const { t } = useLang();
  const { session, ready, signOut } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<WriterStory[]>([]);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    let on = true;
    fetchMyStories(session.token).then((r) => {
      if (on && r.data) setStories(r.data);
    });
    return () => {
      on = false;
    };
  }, [ready, session, router]);

  if (!ready || !session) return <div className="empty">…</div>;

  return (
    <>
      <div className="card" style={{ padding: 20, display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        {session.writer.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.writer.avatar_url} alt={session.writer.writer_name} className="avatar" />
        ) : (
          <div className="avatar-fallback">{session.writer.writer_name[0]?.toUpperCase()}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{session.writer.writer_name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>@{session.writer.username}</div>
        </div>
        <button className="icon-btn" onClick={() => { signOut(); router.push("/"); }}>
          {t("signOut")}
        </button>
      </div>
      <div className="section-head">
        <h2>
          {t("myStories")} ({stories.length})
        </h2>
        <Link href="/write" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>
          + {t("newStory")}
        </Link>
      </div>
      {stories.length ? (
        <ol className="chapter-list">
          {stories.map((s) => (
            <li key={s.id}>
              <span>
                <strong>{s.title}</strong>
                <span style={{ color: "var(--muted)", fontSize: 12, marginLeft: 8 }}>{s.status}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty">{t("noResults")}</div>
      )}
    </>
  );
}
