"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang, type DictKey } from "@/lib/i18n";
import { useState } from "react";
import { fetchReferral, applyAffiliate, type ReferralInfo } from "@/lib/api";

const STEPS: [DictKey, DictKey][] = [
  ["affS1T", "affS1D"],
  ["affS2T", "affS2D"],
  ["affS3T", "affS3D"],
  ["affS4T", "affS4D"],
];

export default function AffiliateClient() {
  const { t } = useLang();
  const { session, ready } = useAuth();
  const [ref, setRef] = useState<ReferralInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState("tiktok");
  const [sUser, setSUser] = useState("");
  const [sFol, setSFol] = useState("");
  const [sContact, setSContact] = useState("");
  const [sMsg, setSMsg] = useState("");
  const [sOk, setSOk] = useState(false);

  if (!ready) {
    return (
      <div className="loading-wrap">
        <span className="spinner" />
        {t("loading")}
      </div>
    );
  }

  const acquire = async () => {
    if (!session || busy) return;
    setBusy(true);
    const r = await fetchReferral(session.token);
    setBusy(false);
    if (r.data && "code" in r.data) setRef(r.data);
  };

  const copy = async (text: string) => {
    try {
      await window.navigator.clipboard.writeText(text);
    } catch {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const submitApp = async () => {
    if (!sUser.trim() || !sContact.trim() || busy) {
      setSOk(false);
      setSMsg(t("requiredFields"));
      return;
    }
    setBusy(true);
    setSMsg("");
    const r = await applyAffiliate({
      platform,
      username: sUser.trim(),
      followers: Math.max(0, parseInt(sFol.replace(/[^0-9]/g, ""), 10) || 0),
      contact: sContact.trim(),
    });
    setBusy(false);
    if (r.data && "ok" in r.data) {
      setSOk(true);
      setSMsg(t("affApplied"));
      setSUser("");
      setSFol("");
      setSContact("");
    } else {
      setSOk(false);
      const err = r.data && "error" in r.data ? String(r.data.error) : "";
      setSMsg(err === "already_applied" ? t("affDup") : t("authFailed"));
    }
  };

  const link = ref ? `https://www.xyteee.com/register?ref=${ref.code}` : "";

  return (
    <>
      <div className="aff-hero">
        <h1>{t("affHero")}</h1>
        <p>{t("affSub")}</p>
      </div>
      <ol className="about-steps">
          {STEPS.map(([h, p], i) => (
            <li key={h} className="about-step" style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="about-snum">{i + 1}</span>
              <div>
                <h3>{t(h)}</h3>
                <p>{t(p)}</p>
              </div>
            </li>
          ))}
      </ol>
      <div className="card aff-card">
        <h2 style={{ fontSize: 18, margin: 0 }}>{t("affJoinT")}</h2>
        <p>{t("affJoinD")}</p>
        <label className="fld-lb" style={{ alignSelf: "flex-start" }}>{t("affPlatform")}</label>
        <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ marginBottom: 10 }}>
          {["tiktok", "facebook", "youtube", "instagram", "other"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="fld-lb" style={{ alignSelf: "flex-start" }}>{t("affUsername")}</label>
        <input className="input" value={sUser} onChange={(e) => setSUser(e.target.value)} maxLength={60} style={{ marginBottom: 10 }} />
        <label className="fld-lb" style={{ alignSelf: "flex-start" }}>{t("affFollowers")}</label>
        <input className="input" value={sFol} onChange={(e) => setSFol(e.target.value)} inputMode="numeric" style={{ marginBottom: 10 }} />
        <label className="fld-lb" style={{ alignSelf: "flex-start" }}>{t("affContact")}</label>
        <input className="input" type="email" value={sContact} onChange={(e) => setSContact(e.target.value)} style={{ marginBottom: 4 }} />
        {sMsg && <p style={{ color: sOk ? "green" : "red", fontSize: 13, fontWeight: 700 }}>{sMsg}</p>}
        <button className="btn btn-premium" onClick={submitApp} disabled={busy} style={{ width: "100%" }}>
          {busy ? t("loading") : t("affApply")}
        </button>
      </div>
      <div className="card aff-card">
        {!session ? (
          <>
            <p>{t("affLoginNeed")}</p>
            <Link className="btn btn-premium" href="/login">
              {t("signIn")}
            </Link>
          </>
        ) : !ref ? (
          <>
            <p>{t("affS2D")}</p>
            <button className="btn btn-premium" onClick={acquire} disabled={busy}>
              {busy ? t("loading") : t("acquireLink")}
            </button>
          </>
        ) : (
          <>
            <div className="ref-cards">
              <div className="card ref-card">
                <span className="ref-n">{ref.uses}</span>
                <span className="ref-l">{t("refUses")}</span>
              </div>
              <div className="card ref-card gold">
                <span className="ref-n">৳{ref.earnings}</span>
                <span className="ref-l">{t("refEarnings")}</span>
              </div>
            </div>
            <div className="share-linkbox">{link}</div>
            <button className="btn" onClick={() => copy(link)}>
              {copied ? t("copiedMsg") : t("copyLink")}
            </button>
          </>
        )}
      </div>
    </>
  );
}
