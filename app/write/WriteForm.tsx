"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createStory, createChapter, uploadCover, getCategories, submitStoryForReview, type ApiCategory } from "@/lib/api";
import EditorToolbar from "@/components/EditorToolbar";
import RichText from "@/components/RichText";
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
  const [doneStatus, setDoneStatus] = useState<"draft" | "pending" | "published">("draft");
  const [step, setStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const chBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [vis, setVis] = useState<"both" | "website">("both");
  const [stype, setStype] = useState<"episodes" | "complete">("episodes");
  const [restored, setRestored] = useState(false);

  const DRAFT_KEY = "lk-write-draft";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.title === "string") setTitle(d.title);
        if (typeof d.desc === "string") setDesc(d.desc);
        if (typeof d.cat === "string") setCat(d.cat);
        if (typeof d.chTitle === "string") setChTitle(d.chTitle);
        if (typeof d.chBody === "string") setChBody(d.chBody);
        if (d.vis === "website" || d.vis === "both") setVis(d.vis);
        if (d.stype === "complete" || d.stype === "episodes") setStype(d.stype);
        if (typeof d.step === "number") setStep(Math.min(Math.max(d.step, 0), 3));
      }
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, desc, cat, chTitle, chBody, vis, stype, step })
      );
    } catch {}
  }, [title, desc, cat, chTitle, chBody, vis, stype, step, restored]);

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const steps = [t("stepInfo"), t("stepCover"), t("stepChapter"), t("stepReview")];

  const onFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : "");
  };

  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  const next = () => {
    setErr("");
    if (step === 0 && !title.trim()) {
      setErr(t("requiredFields"));
      return;
    }
    if (step === 0 && words(title) > 50) {
      setErr(t("titleMaxW"));
      return;
    }
    if (step === 1 && !file) {
      setErr(t("coverRequired"));
      return;
    }
    if (step === 2 && ((stype === "episodes" && !chTitle.trim()) || !chBody.trim())) {
      setErr(t("requiredFields"));
      return;
    }
    if (step === 2 && chBody.trim().length < 500) {
      setErr(t("chMinLen"));
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  useEffect(() => {
    getCategories().then((c) => {
      if (c) setCats(c);
    });
  }, []);

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  if (!ready || !session) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
        {t("loading")}
      </div>
    );
  }

  const submit = async () => {
    const finalChTitle = stype === "complete" ? title.trim() : chTitle.trim();
    if (!title.trim() || !finalChTitle || !chBody.trim() || busy) {
      setErr(t("requiredFields"));
      return;
    }
    if (words(title) > 50) {
      setErr(t("titleMaxW"));
      return;
    }
    if (chBody.trim().length < 500) {
      setErr(t("chMinLen"));
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
        visible_on: vis,
      });
      if (!s.data || !("id" in s.data)) {
        setErr(t("authFailed"));
        setBusy(false);
        return;
      }
      const storyId = (s.data as { id: string }).id;
      const ch = await createChapter(session.token, storyId, { title: finalChTitle, body: chBody.trim() });
      if (!ch.data) {
        setErr(t("authFailed"));
        setBusy(false);
        return;
      }
      setDoneId(storyId);
      clearDraft();
    } catch {
      setErr(t("authFailed"));
    }
    setBusy(false);
  };

  const sendForReview = async () => {
    if (!session || !doneId || busy) return;
    setBusy(true);
    setErr("");
    const r = await submitStoryForReview(session.token, doneId);
    setBusy(false);
    if (r.data && "status" in r.data && r.data.status) {
      setDoneStatus(r.data.status === "published" ? "published" : "pending");
    } else if (r.data && "ok" in r.data) {
      setDoneStatus("pending");
    } else {
      setErr(t("authFailed"));
    }
  };

  if (doneId) {
    return (
      <div className="card wiz-done">
        <span className={doneStatus === "draft" ? "coming-pill" : "dash-pill on"} style={{ fontSize: 13 }}>
          {doneStatus === "published" ? t("publishedDone") : doneStatus === "pending" ? t("submittedDone") : t("storyCreated")}
        </span>
        {doneStatus === "draft" ? (
          <>
            <p className="wiz-hint" style={{ marginTop: 14 }}>{t("reviewNote")}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
              <button className="btn btn-premium" onClick={sendForReview} disabled={busy}>
                {busy ? t("loading") : t("sendReview")}
              </button>
              <Link className="btn btn-ghost" href="/account">
                {t("submitLater")}
              </Link>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <Link className="btn btn-premium" href="/account">
              {t("myStories")}
            </Link>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setDoneId("");
                setDoneStatus("draft");
                setTitle("");
                setDesc("");
                setChTitle("");
                setChBody("");
                setFile(null);
                clearDraft();
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl("");
                setStep(0);
              }}
            >
              {t("newStory")}
            </button>
          </div>
        )}
        {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700, marginTop: 12 }}>{err}</p>}
      </div>
    );
  }

  return (
    <div className="card wiz-card">
      <ol className="wiz-steps">
        {steps.map((s, i) => (
          <li key={s} className={i === step ? "on" : i < step ? "done" : ""}>
            <span className="wiz-dot">{i < step ? "✓" : i + 1}</span>
            <span className="wiz-lb">{s}</span>
          </li>
        ))}
      </ol>
      <div className="wiz-bar">
        <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      {step === 0 && (
        <>
          <label className="fld-lb">{t("storyTitle")}</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} style={{ marginBottom: 12 }} />
          <label className="fld-lb">{t("storyDesc")}</label>
          <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={150} style={{ marginBottom: 12 }} />
          <label className="fld-lb">{t("storyCategory")}</label>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} style={{ marginBottom: 6 }}>
            <option value="">—</option>
            {cats.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="wiz-hint">
            {t("catHint")}{" "}
            <Link href="/categories/new" style={{ color: "var(--accent)", fontWeight: 700 }}>
              {t("catMakeNew")}
            </Link>
          </p>
          <label className="fld-lb">{t("storyType")}</label>
          <div className="vis-pills" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className={stype === "episodes" ? "chip chip-on" : "chip"}
              onClick={() => setStype("episodes")}
            >
              {t("typeEpisodes")}
            </button>
            <button
              type="button"
              className={stype === "complete" ? "chip chip-on" : "chip"}
              onClick={() => setStype("complete")}
            >
              {t("typeComplete")}
            </button>
          </div>
          <label className="fld-lb">{t("visibilityLabel")}</label>
          <div className="vis-pills">
            <button
              type="button"
              className={vis === "both" ? "chip chip-on" : "chip"}
              onClick={() => setVis("both")}
            >
              {t("visBoth")}
            </button>
            <button
              type="button"
              className={vis === "website" ? "chip chip-on" : "chip"}
              onClick={() => setVis("website")}
            >
              {t("visWebsite")}
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <label className="fld-lb">{t("storyCover")} *</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="wiz-preview" />
          )}
        </>
      )}

      {step === 2 && (
        <>
          {stype === "episodes" && (
            <>
              <label className="fld-lb">{t("storyTitle")}</label>
              <input className="input" value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder={t("chapterTitlePh")} style={{ marginBottom: 8 }} />
            </>
          )}
          <EditorToolbar value={chBody} onChange={setChBody} textAreaRef={chBodyRef} />
          <textarea ref={chBodyRef} className="textarea" value={chBody} onChange={(e) => setChBody(e.target.value)} placeholder={t("chapterBodyPh")} style={{ minHeight: 220 }} />
        </>
      )}

      {step === 3 && (
        <>
          <p className="wiz-hint">{t("reviewNote")}</p>
          <div className="wiz-review">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="wiz-review-cover" />
            )}
            <div>
              <strong className="wiz-review-title">{title || "—"}</strong>
              <div className="wiz-review-meta">
                {cat || "—"} · {stype === "complete" ? title.trim() || "—" : chTitle || "—"}
              </div>
              <p className="wiz-review-desc">{desc || "—"}</p>
            </div>
          </div>
          <h3 className="wiz-preview-h">{stype === "complete" ? title.trim() || "—" : chTitle || "—"}</h3>
          <div className="card wiz-preview-body">
            <article className="reader">
              <RichText body={chBody || "—"} />
            </article>
          </div>
        </>
      )}

      {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700, marginTop: 12 }}>{err}</p>}
      <div className="wiz-nav">
        {step > 0 ? (
          <button className="btn btn-ghost" onClick={() => { setErr(""); setStep((s) => s - 1); }} disabled={busy}>
            {t("backBtn")}
          </button>
        ) : <span />}
        {step < 3 ? (
          <button className="btn btn-premium" onClick={next} disabled={busy}>
            {t("nextBtn")}
          </button>
        ) : (
          <button className="btn btn-premium" onClick={submit} disabled={busy}>
            {busy ? t("loading") : t("publishStory")}
          </button>
        )}
      </div>
    </div>
  );
}
