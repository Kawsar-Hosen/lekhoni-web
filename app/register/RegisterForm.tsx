"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { writerSignup, verifyWriterCode, resendWriterCode } from "@/lib/api";
import GoogleButton, { safeNext } from "@/components/GoogleButton";
import Icon from "@/components/Icon";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export default function RegisterForm({ verifyEmail = "", initialRef = "", next = "" }: { verifyEmail?: string; initialRef?: string; next?: string }) {
  const { t } = useLang();
  const { signIn } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [writerName, setWriterName] = useState("");
  const [email, setEmail] = useState(verifyEmail);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [code, setCode] = useState("");
  const [refCode, setRefCode] = useState(initialRef);
  const [step, setStep] = useState<"form" | "verify">(verifyEmail ? "verify" : "form");
  const [sentTo, setSentTo] = useState(verifyEmail);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doSignup = async () => {
    if (!username.trim() || !writerName.trim() || !email.trim() || !pw || busy) {
      setErr(t("requiredFields"));
      return;
    }
    if (pw !== pw2) {
      setErr(t("pwMismatch"));
      return;
    }
    setBusy(true);
    setErr("");
    const r = await writerSignup({ username: username.trim(), writerName: writerName.trim(), email: email.trim(), password: pw, ref: refCode.trim() || undefined });
    setBusy(false);
    if (!r) {
      setErr(t("authFailed"));
      return;
    }
    if ("writer" in r) {
      signIn(r.writer, r.token);
      router.push(safeNext(next));
      return;
    }
    if ("needs_verification" in r) {
      setSentTo(r.email);
      setStep("verify");
      return;
    }
    setErr(t("authFailed"));
  };

  const doVerify = async () => {
    if (code.trim().length < 6 || busy) return;
    setBusy(true);
    setErr("");
    const r = await verifyWriterCode(sentTo, code.trim());
    setBusy(false);
    if (!r) {
      setErr(t("authFailed"));
      return;
    }
    if ("writer" in r) {
      signIn(r.writer, r.token);
      router.push(safeNext(next));
      return;
    }
    setErr(t("authFailed"));
  };

  const doResend = async () => {
    if (!sentTo || busy) return;
    setBusy(true);
    const r = await resendWriterCode(sentTo);
    setBusy(false);
    if (!r || !("ok" in r)) setErr(t("authFailed"));
  };

  return (
    <div className="card" style={{ padding: 20, maxWidth: 420 }}>
      {step === "form" ? (
        <>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("username")}</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" style={{ marginBottom: 12 }} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("writerName")}</label>
          <input className="input" value={writerName} onChange={(e) => setWriterName(e.target.value)} style={{ marginBottom: 12 }} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("email")}</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={{ marginBottom: 12 }} />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("password")}</label>
          <div className="pw-wrap" style={{ marginBottom: 12 }}>
            <input className="input" type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
            <button type="button" className="pw-eye" onClick={() => setShowPw((v) => !v)} aria-label="show password">
              <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            {t("confirmPw")}
            <span style={{ position: "relative", display: "inline-flex" }}>
              <button
                type="button"
                className="how-q"
                onClick={() => setShowHint((v) => !v)}
                aria-label={t("confirmPw")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.6-3 4" />
                  <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </button>
              {showHint && <span className="hint-pop">{t("confirmPwHint")}</span>}
            </span>
          </label>
          <div className="pw-wrap" style={{ marginBottom: 12 }}>
            <input className="input" type={showPw2 ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            <button type="button" className="pw-eye" onClick={() => setShowPw2((v) => !v)} aria-label="show password">
              <Icon name={showPw2 ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("couponLbl")}</label>
          <input className="input" value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="name-xxxxx" autoComplete="off" style={{ marginBottom: 4 }} />
          {initialRef ? <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>{t("refApplied")}</p> : null}
          {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700 }}>{err}</p>}
          <button className="btn" onClick={doSignup} disabled={busy} style={{ width: "100%", marginTop: 8 }}>
            {t("signUp")}
          </button>
          <GoogleButton referral={refCode.trim() || initialRef} next={next} />
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
            {t("haveAccount")}{" "}
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} style={{ color: "var(--accent)", fontWeight: 700 }}>
              {t("signIn")}
            </Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>{t("checkInbox")}</p>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>{t("verifyCode")}</label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="••••••"
            style={{ marginBottom: 4 }}
          />
          {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700 }}>{err}</p>}
          <button className="btn" onClick={doVerify} disabled={busy} style={{ width: "100%", marginTop: 8 }}>
            {t("verifyBtn")}
          </button>
          <button className="btn btn-ghost" onClick={doResend} disabled={busy} style={{ width: "100%", marginTop: 8 }}>
            {t("sendCode")}
          </button>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} style={{ color: "var(--accent)", fontWeight: 700 }}>
              {t("backToLogin")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
