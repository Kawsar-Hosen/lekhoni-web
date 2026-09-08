"use client";

import { useEffect, useState } from "react";
import { getComments, postComment, type ApiComment } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import { useLang } from "@/lib/i18n";

export default function Comments({ bookId }: { bookId: string }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState<ApiComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let on = true;
    getComments(bookId).then((c) => {
      if (on) setItems(c);
    });
    return () => {
      on = false;
    };
  }, [bookId]);

  const submit = async () => {
    if (!name.trim() || !body.trim() || busy) return;
    setBusy(true);
    setMsg("");
    const r = await postComment(bookId, getDeviceId(), name.trim(), body.trim());
    setBusy(false);
    if (r.ok) {
      setBody("");
      setMsg(t("commentPending"));
      getComments(bookId).then(setItems);
    } else {
      setMsg(t("commentFailed"));
    }
  };

  return (
    <section className="section" id="comments">
      <div className="section-head">
        <h2>
          {t("comments")} ({items.length})
        </h2>
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("yourName")}
          maxLength={50}
          style={{ marginBottom: 8 }}
          aria-label={t("yourName")}
        />
        <textarea
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("writeComment")}
          maxLength={1000}
          aria-label={t("writeComment")}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
          <button className="btn" onClick={submit} disabled={busy || !name.trim() || !body.trim()}>
            {t("post")}
          </button>
          {msg && <span style={{ fontSize: 13, color: "var(--muted)" }}>{msg}</span>}
        </div>
      </div>
      {items.map((c) => (
        <div key={c.id} className="card" style={{ padding: "12px 16px", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            {c.display_name}
            <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 8, fontSize: 12 }}>
              {new Date(c.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")}
            </span>
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{c.body}</div>
        </div>
      ))}
    </section>
  );
}
