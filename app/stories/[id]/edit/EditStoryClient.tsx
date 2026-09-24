"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useCallback, useEffect, useState } from "react";
import EditorToolbar from "@/components/EditorToolbar";
import RichText from "@/components/RichText";
import Icon from "@/components/Icon";
import {
  fetchStoryDetail,
  updateStory,
  addStoryChapter,
  uploadCover,
  getCategories,
  type ApiCategory,
  type StoryDetail,
} from "@/lib/api";

export default function EditStoryClient({ storyId }: { storyId: string }) {
  const { t } = useLang();
  const { session, ready } = useAuth();
  const router = useRouter();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [vis, setVis] = useState<"both" | "website">("both");
  const [wstat, setWstat] = useState("complete");
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chTitle, setChTitle] = useState("");
  const [chBody, setChBody] = useState("");
  const [chMsg, setChMsg] = useState("");
  const isComplete = (story?.story_type || "") === "complete";
  const [taEl, setTaEl] = useState<HTMLTextAreaElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const load = useCallback(() => {
    if (!session) return;
    fetchStoryDetail(session.token, storyId).then((r) => {
      if (r.data && "id" in r.data) {
        const s = r.data;
        setStory(s);
        setTitle(s.title || "");
        setDesc(s.description || "");
        setCat(s.category || "");
        setVis((s as { visible_on?: string }).visible_on === "website" ? "website" : "both");
        setWstat((s as { writer_status?: string }).writer_status === "ongoing" ? "ongoing" : "complete");
        setIsNew(Boolean((s as { is_new?: boolean }).is_new));
      }
    });
  }, [session, storyId]);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    load();
    getCategories().then((c) => {
      if (c) setCats(c);
    });
  }, [ready, session, router, load]);

  if (!ready || !session) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
        {t("loading")}
      </div>
    );
  }

  const save = async () => {
    if (!session || busy) return;
    if (!title.trim()) {
      setOk(false);
      setMsg(t("requiredFields"));
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const tlen = title.trim().length;
      if (tlen < 5 || tlen > 50) {
        setOk(false);
        setMsg(t("titleMax30"));
        setBusy(false);
        return;
      }
      let coverUrl: string | undefined;
      if (file) {
        const up = await uploadCover(file);
        if (!up.url) {
          setOk(false);
          setMsg(t("authFailed"));
          setBusy(false);
          return;
        }
        coverUrl = up.url;
      }
      const r = await updateStory(session.token, storyId, {
        title: title.trim(),
        description: desc.trim(),
        category: cat,
        ...(coverUrl ? { cover_url: coverUrl } : {}),
        visible_on: vis,
        writer_status: wstat,
        is_new: isNew,
      });
      if (r.data && "ok" in r.data) {
        setOk(true);
        setMsg(t("savedMsg"));
        setFile(null);
        load();
      } else {
        setOk(false);
        setMsg(t("authFailed"));
      }
    } catch {
      setOk(false);
      setMsg(t("authFailed"));
    }
    setBusy(false);
  };

  const addCh = async () => {
    if (!session || busy) return;
    if (!chTitle.trim() || !chBody.trim()) {
      setChMsg(t("requiredFields"));
      return;
    }
    if (chBody.trim().length < 500) {
      setChMsg(t("chMinLen"));
      return;
    }
    setBusy(true);
    setChMsg("");
    const r = await addStoryChapter(session.token, storyId, { title: chTitle.trim(), body: chBody.trim() });
    setBusy(false);
    if (r.data && "id" in r.data) {
      setChTitle("");
      setChBody("");
      setChMsg(t("chapterAdded"));
      load();
    } else {
      setChMsg(t("authFailed"));
    }
  };

  return (
    <>
      <div className="section-head">
        <h2>{t("editStory")}</h2>
      </div>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <label className="fld-lb">{t("storyTitle")}</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} style={{ marginBottom: 12 }} />
        <label className="fld-lb">{t("storyDesc")}</label>
        <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="fld-lb">{t("storyCategory")}</label>
            <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">—</option>
              {cats.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="wiz-hint" style={{ marginTop: 6 }}>
              {t("catHint")}{" "}
              <Link href="/categories/new" style={{ color: "var(--accent)", fontWeight: 700 }}>
                {t("catMakeNew")}
              </Link>
            </p>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="fld-lb">{t("storyCover")}</label>
            <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <label className="fld-lb" style={{ marginTop: 12 }}>{t("visibilityLabel")}</label>
        <div className="vis-pills">
          <button type="button" className={vis === "both" ? "chip chip-on" : "chip"} onClick={() => setVis("both")}>
            {t("visBoth")}
          </button>
          <button type="button" className={vis === "website" ? "chip chip-on" : "chip"} onClick={() => setVis("website")}>
            {t("visWebsite")}
          </button>
        </div>
        <label className="fld-lb" style={{ marginTop: 12 }}>{t("storyState")}</label>
        <div className="vis-pills">
          <button type="button" className={wstat === "ongoing" ? "chip chip-on" : "chip"} onClick={() => setWstat("ongoing")}>
            {t("stateOngoing")}
          </button>
          <button type="button" className={wstat === "complete" ? "chip chip-on" : "chip"} onClick={() => setWstat("complete")}>
            {t("stateComplete")}
          </button>
        </div>
        <label className="ed-check" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
          {t("markNew")}
        </label>
        {story?.cover_url && !file && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.cover_url} alt="" style={{ width: 90, borderRadius: 8, marginTop: 12 }} />
        )}
        {msg && <p style={{ color: ok ? "green" : "red", fontSize: 13, fontWeight: 700 }}>{msg}</p>}
        <button className="btn btn-premium" onClick={save} disabled={busy} style={{ marginTop: 12 }}>
          {busy ? t("loading") : t("save")}
        </button>
      </div>

      {!isComplete && (
        <>
          <div className="section-head">
            <h2>
              {t("chaptersLabel")} ({story?.chapters?.length ?? 0})
            </h2>
          </div>
          {(story?.chapters?.length ?? 0) > 0 && (
            <ol className="chapter-list" style={{ marginBottom: 16 }}>
              {(story?.chapters || []).map((c, i) => (
                <li key={c.id}>
                  <span>
                    {i + 1}. {c.title}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>{t("addChapter")}</h3>
            <input
              className="input"
              value={chTitle}
              onChange={(e) => setChTitle(e.target.value)}
              placeholder={t("chapterTitlePh")}
              style={{ marginBottom: 8 }}
            />
            <div className="ed-row">
              <div style={{ flex: 1 }}>
                <EditorToolbar value={chBody} onChange={setChBody} el={taEl} />
              </div>
              <button
                type="button"
                className={`ed-preview-toggle${showPreview ? " on" : ""}`}
                onClick={() => setShowPreview((v) => !v)}
                title="Preview"
                aria-label="Preview"
              >
                <Icon name={showPreview ? "eyeOff" : "eye"} size={15} />
              </button>
            </div>
            <textarea
              ref={setTaEl}
              className="textarea"
              value={chBody}
              onChange={(e) => setChBody(e.target.value)}
              placeholder={t("chapterBodyPh")}
              style={{ minHeight: 160 }}
            />
            {showPreview && chBody.trim() ? (
              <div className="card live-preview">
                <article className="reader reader-sm">
                  <RichText body={chBody} />
                </article>
              </div>
            ) : null}
            {chMsg && <p style={{ fontSize: 13, fontWeight: 700 }}>{chMsg}</p>}
            <button className="btn" onClick={addCh} disabled={busy} style={{ marginTop: 12 }}>
              {t("addChapter")}
            </button>
          </div>
        </>
      )}
    </>
  );
}
