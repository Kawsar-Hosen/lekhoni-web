"use client";

import { useState } from "react";
import { useLang, type DictKey } from "@/lib/i18n";

const API = "/backend";

export default function DeleteRequestPage() {
  const { t } = useLang();
  const [contact, setContact] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState<DictKey>("delR1");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const REASONS: DictKey[] = ["delR1", "delR2", "delR3", "delR4", "delR5", "delR6"];

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
        body: JSON.stringify({
          contact: contact.trim(),
          identifier: identifier.trim(),
          details: `[${t(reason)}] ${details.trim()}`,
        }),
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
        <div className="contact-hero">
          <h1>{t("delTitle")}</h1>
          <p>{t("delIntro")}</p>
          <span className="contact-sla">{t("respond48")}</span>
        </div>
        <div className="card del-card">
          <label className="fld-lb">{t("delReasonL")}</label>
          <select
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value as DictKey)}
            style={{ marginBottom: 14 }}
          >
            {REASONS.map((rk) => (
              <option key={rk} value={rk}>
                {t(rk)}
              </option>
            ))}
          </select>
          <label className="fld-lb">{t("delContactL")}</label>
          <input className="input" type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{ marginBottom: 12 }} />
          <label className="fld-lb">{t("delIdentL")}</label>
          <input
            className="input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("delIdentPh")}
            style={{ marginBottom: 12 }}
          />
          <label className="fld-lb">{t("delDetL")}</label>
          <textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} />
          <button className="btn btn-premium" onClick={send} disabled={busy} style={{ marginTop: 14, width: "100%" }}>
            {busy ? t("loading") : t("delSubmit")}
          </button>
          {msg && (
            <p style={{ color: ok ? "green" : "red", fontWeight: 700, fontSize: 14, textAlign: "center" }}>{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
