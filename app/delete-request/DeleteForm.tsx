"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";

const API = "/backend";

export default function DeleteRequestPage() {
  const { t } = useLang();
  const [contact, setContact] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!contact.trim() || !identifier.trim() || busy) {
      setOk(false);
      setMsg(t("delRequire"));
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(`${API}/api/public/deletion-requests`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), identifier: identifier.trim(), details: details.trim() }),
      });
      if (r.status === 429) {
        setOk(false);
        setMsg(t("delMany"));
      } else if (r.ok) {
        setOk(true);
        setMsg(t("delOk"));
        setContact("");
        setIdentifier("");
        setDetails("");
      } else {
        setOk(false);
        setMsg(t("delErr"));
      }
    } catch {
      setOk(false);
      setMsg(t("delNet"));
    }
    setBusy(false);
  };

  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>{t("delTitle")}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          {t("delIntro")}
        </p>
        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            {t("delContactL")}
          </label>
          <input className="input" type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>
            {t("delIdentL")}
          </label>
          <input
            className="input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("delIdentPh")}
          />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>
            {t("delDetL")}
          </label>
          <textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} />
          <button className="btn" onClick={send} disabled={busy} style={{ marginTop: 12, width: "100%" }}>
            {t("delSubmit")}
          </button>
          {msg && (
            <p style={{ color: ok ? "green" : "red", fontWeight: 700, fontSize: 14, textAlign: "center" }}>{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
