"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createStory, createChapter, uploadCover, getCategories, submitStoryForReview, type ApiCategory } from "@/lib/api";
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
  const [vis, setVis] = useState<"both" | "website">("both");

  const steps = [t("stepInfo"), t("stepCover"), t("stepChapter"), t("stepReview")];

  const onFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : "");
  };

  const next = () => {
    setErr("");
    if (step === 0 && !title.trim()) {
      setErr(t("requiredFields"));
      return;
    }
    if (step === 1 && !file) {
      setErr(t("coverRequired"));
      return;
    }
    if (step === 2 && (!chTitle.trim() || !chBody.trim())) {
      setErr(t("requiredFields"));
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
        visible_on: vis,
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
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} style={{ marginBottom: 12 }} />
          <label className="fld-lb">{t("storyDesc")}</label>
          <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} style={{ marginBottom: 12 }} />
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
          <label className="fld-lb">{t("storyTitle")}</label>
          <input className="input" value={chTitle} onChange={(e) => setChTitle(e.target.value)} placeholder={t("chapterTitlePh")} style={{ marginBottom: 8 }} />
          <textarea className="textarea" value={chBody} onChange={(e) => setChBody(e.target.value)} placeholder={t("chapterBodyPh")} style={{ minHeight: 220 }} />
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
                {cat || "—"} · {chTitle || "—"}
              </div>
              <p className="wiz-review-desc">{desc || "—"}</p>
            </div>
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
