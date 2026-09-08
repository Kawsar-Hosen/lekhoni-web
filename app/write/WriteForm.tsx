"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createStory, createChapter, uploadCover, getCategories, type ApiCategory } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export default function WriteForm() {
  const { t } = useLang();
  const { session, ready } = useAuth();
  const router = useRouter();
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [chTitle, setChTitle] = useState("");
  const [chBody, setChBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState("");

  useEffect(() => {
    getCategories().then((c) => {
      if (c) setCats(c);
    });
  }, []);

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready || !session) return <div className="empty">…</div>;

  const submit = async () => {
    if (!title.trim() || !chTitle.trim() || !chBody.trim() || busy) {
      setErr(t("requiredFields"));
      return;
    }
    setBusy(true);
    setErr("");
    try {
      let coverUrl = "";
      if (file) {
        const up = await uploadCover(file);
        if (!up.url) {
          setErr(up.error === "too-large" ? "Image too large (max 10MB)." : t("authFailed"));
          setBusy(false);
          return;
        }
        coverUrl = up.url;
      }
      const s = await createStory(session.token, {
        title: title.trim(),
        description: desc.trim(),
        category: cat,
        cover_url: coverUrl || undefined,
      });
      if (!s.data || !("id" in s.data)) {
        setErr(t("authFailed"));
        setBusy(false);
        return;
      }
      const storyId = (s.data as { id: string }).id;
      const ch = await createChapter(session.token, storyId, { title: chTitle.trim(), body: chBody.trim() });
      if (!ch.data) {
        setErr(t("authFailed"));
        setBusy(false);
        return;
      }
      setDoneId(storyId);
    } catch {
      setErr(t("authFailed"));
    }
    setBusy(false);
  };

  if (doneId) {
    return (
      <div className="card" style={{ padding: 24, textAlign: "center" }}>
        <p style={{ fontWeight: 800 }}>✓ {t("storyCreated")}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
          <Link className="btn" href="/account">
            {t("myStories")}
          </Link>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setDoneId("");
              setTitle("");
              setDesc("");
              setChTitle("");
              setChBody("");
              setFile(null);
            }}
          >
            {t("newStory")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("storyTitle")}</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} style={{ marginBottom: 12 }} />
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("storyDesc")}</label>
      <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} style={{ marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("storyCategory")}</label>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">—</option>
            {cats.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("storyCover")}</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
      </div>
      <h3 style={{ fontSize: 15, margin: "18px 0 8px" }}>{t("firstChapter")}</h3>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("storyTitle")}</label>
      <input className="input" value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder={t("chapterTitlePh")} style={{ marginBottom: 8 }} />
      <textarea className="textarea" value={chBody} onChange={(e) => setChBody(e.target.value)} placeholder={t("chapterBodyPh")} style={{ minHeight: 180 }} />
      {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700 }}>{err}</p>}
      <button className="btn" onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 12 }}>
        {t("createStory")}
      </button>
      {!session && <p style={{ fontSize: 13, color: "var(--muted)" }}>{t("loginRequired")}</p>}
    </div>
  );
}
