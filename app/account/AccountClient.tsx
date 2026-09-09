"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { fetchMyStories, updateWriterProfile, uploadCover, type WriterStory } from "@/lib/api";

export default function AccountClient() {
  const { t } = useLang();
  const { session, ready, signIn, signOut } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<WriterStory[]>([]);
  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState("");
  const [eUser, setEUser] = useState("");
  const [eBio, setEBio] = useState("");
  const [eFile, setEFile] = useState<File | null>(null);
  const [eMsg, setEMsg] = useState("");
  const [eOk, setEOk] = useState(false);
  const [eBusy, setEBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    let on = true;
    const load = () => {
      if (!session) return;
      fetchMyStories(session.token).then((r) => {
        if (on && r.data) setStories(r.data);
      });
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      on = false;
      window.removeEventListener("focus", load);
    };
  }, [ready, session, router]);

  if (!ready || !session) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
        {t("loading")}
      </div>
    );
  }

  const startEdit = () => {
    setEName(session.writer.writer_name || "");
    setEUser(session.writer.username || "");
    setEBio(session.writer.bio || "");
    setEFile(null);
    setEMsg("");
    setEOk(false);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!session || eBusy) return;
    if (!eName.trim() || !eUser.trim()) {
      setEOk(false);
      setEMsg(t("requiredFields"));
      return;
    }
    setEBusy(true);
    setEMsg("");
    try {
      let avatarUrl = session.writer.avatar_url || undefined;
      if (eFile) {
        const up = await uploadCover(eFile);
        if (!up.url) {
          setEOk(false);
          setEMsg(t("authFailed"));
          setEBusy(false);
          return;
        }
        avatarUrl = up.url;
      }
      const r = await updateWriterProfile(session.token, {
        writer_name: eName.trim(),
        username: eUser.trim(),
        bio: eBio.trim(),
        avatar_url: avatarUrl || undefined,
      });
      if (!r.data || !("ok" in r.data)) {
        setEOk(false);
        const err = r.data && "error" in r.data ? String(r.data.error) : "";
        setEMsg(err === "Username already taken" ? t("nameTaken") : t("authFailed"));
        setEBusy(false);
        return;
      }
      signIn(
        { ...session.writer, writer_name: eName.trim(), username: eUser.trim(), bio: eBio.trim(), avatar_url: avatarUrl || null },
        session.token
      );
      setEOk(true);
      setEMsg(t("savedMsg"));
      setEditing(false);
    } catch {
      setEOk(false);
      setEMsg(t("authFailed"));
    }
    setEBusy(false);
  };

  return (
    <>
      <div
        className="card acct-hero"
        style={session.writer.avatar_url ? { backgroundImage: `url(${session.writer.avatar_url})` } : undefined}
      >
        <div className="acct-wash" />
        <div className="acct-top">
          {session.writer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.writer.avatar_url} alt={session.writer.writer_name} className="acct-ava" />
          ) : (
            <div className="acct-ava acct-ava-fb">{session.writer.writer_name[0]?.toUpperCase()}</div>
          )}
          <div className="acct-id">
            <div className="acct-name">
              {session.writer.writer_name}
              <VerifiedBadge badge={session.writer.badge} size={18} />
            </div>
            <div className="acct-user">@{session.writer.username}</div>
          </div>
        </div>
        <div className="acct-stats">
          <span><strong>{stories.length}</strong> {t("myStories")}</span>
          <i>·</i>
          <span><strong>{session.writer.follower_count || 0}</strong> {t("followers")}</span>
        </div>
        <div className="acct-actions">
          <button className="btn btn-premium acct-btn" onClick={startEdit}>
            {t("editProfile")}
          </button>
          <button className="icon-btn" onClick={() => { signOut(); router.push("/"); }}>
            {t("signOut")}
          </button>
        </div>
      </div>
      {editing && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("writerName")}</label>
          <input className="input" value={eName} onChange={(e) => setEName(e.target.value)} maxLength={60} style={{ marginBottom: 12 }} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("username")}</label>
          <input className="input" value={eUser} onChange={(e) => setEUser(e.target.value)} maxLength={30} style={{ marginBottom: 12 }} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("bioLabel")}</label>
          <textarea className="textarea" value={eBio} onChange={(e) => setEBio(e.target.value)} maxLength={300} style={{ marginBottom: 12 }} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("changePhoto")}</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setEFile(e.target.files?.[0] || null)} style={{ marginBottom: 12 }} />
          {eMsg && <p style={{ color: eOk ? "green" : "red", fontSize: 13, fontWeight: 700 }}>{eMsg}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={saveEdit} disabled={eBusy} style={{ flex: 1 }}>
              {t("save")}
            </button>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
      {eMsg && !editing && (
        <p style={{ color: eOk ? "green" : "red", fontSize: 13, fontWeight: 700, textAlign: "center" }}>{eMsg}</p>
      )}
      <div className="section-head">
        <h2>
          {t("myStories")} ({stories.length})
        </h2>
        <Link href="/dashboard" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>
          {t("dashboard")}
        </Link>
        <Link href="/write" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>
          + {t("newStory")}
        </Link>
      </div>
      {stories.length ? (
        <div className="acct-stories">
          {stories.map((s) => (
            <div key={s.id} className="card acct-story">
              {s.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover_url} alt={s.title} className="acct-cover" loading="lazy" />
              ) : (
                <div className="acct-cover acct-cover-fb">{s.title[0]?.toUpperCase()}</div>
              )}
              <div className="acct-story-info">
                <Link href={`/stories/${s.id}/edit`} style={{ fontSize: 15, fontWeight: 800 }}>
                  {s.title}
                </Link>
                <span className="acct-story-meta">
                  <span className={`pill st-${s.status}`}>{s.status}</span>
                  {typeof s.chapters_count === "number" ? ` · ${s.chapters_count} ${t("chapters")}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">{t("noResults")}</div>
      )}
    </>
  );
}
