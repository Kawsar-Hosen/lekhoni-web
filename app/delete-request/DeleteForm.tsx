"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";

const API = "https://lekhoni-admin-api.smdkawsar2.workers.dev";

export default function DeleteRequestPage() {
  const { lang } = useLang();
  const bn = lang === "bn";
  const [contact, setContact] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!contact.trim() || !identifier.trim() || busy) {
      setOk(false);
      setMsg(bn ? "ইমেইল ও শনাক্তকারী দাও।" : "Enter email and identifier.");
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
        setMsg(bn ? "অনেকবার চেষ্টা হয়েছে — পরে চেষ্টা করো।" : "Too many requests — try later.");
      } else if (r.ok) {
        setOk(true);
        setMsg(
          bn
            ? "অনুরোধ পেয়েছি। ৩০ দিনের মধ্যে ইমেইলে নিশ্চিত করা হবে।"
            : "Request received. We will confirm by email within 30 days."
        );
        setContact("");
        setIdentifier("");
        setDetails("");
      } else {
        setOk(false);
        setMsg(bn ? "ব্যর্থ। দেখে আবার চেষ্টা করো।" : "Failed. Check and try again.");
      }
    } catch {
      setOk(false);
      setMsg(bn ? "নেটওয়ার্ক সমস্যা।" : "Network error.");
    }
    setBusy(false);
  };

  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>{bn ? "তথ্য মোছার অনুরোধ" : "Delete My Data"}</h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          {bn
            ? "অ্যাপে (Writer Studio / Settings) না গিয়েও এখান থেকে মোছার অনুরোধ পাঠাতে পারো।"
            : "Request deletion here without opening the app. Writers can also delete inside the app; readers via Settings."}
        </p>
        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            {bn ? "যোগাযোগের ইমেইল" : "Contact email"}
          </label>
          <input className="input" type="email" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>
            {bn ? "অ্যাকাউন্ট শনাক্তকারী" : "Account identifier"}
          </label>
          <input
            className="input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={bn ? "ইউজারনেম বা লেখক নাম" : "Username or writer name"}
          />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>
            {bn ? "বিস্তারিত (ঐচ্ছিক)" : "Details (optional)"}
          </label>
          <textarea className="textarea" value={details} onChange={(e) => setDetails(e.target.value)} />
          <button className="btn" onClick={send} disabled={busy} style={{ marginTop: 12, width: "100%" }}>
            {bn ? "অনুরোধ পাঠান" : "Submit request"}
          </button>
          {msg && (
            <p style={{ color: ok ? "green" : "red", fontWeight: 700, fontSize: 14, textAlign: "center" }}>{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
