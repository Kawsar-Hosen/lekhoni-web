"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { forgotWriterPassword, resetWriterPassword } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export default function ForgotClient() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!email.trim() || busy) {
      setErr(t("requiredFields"));
      return;
    }
    setBusy(true);
    setErr("");
    const r = await forgotWriterPassword(email.trim());
    setBusy(false);
    if (r.data && "ok" in r.data) {
      setStep("reset");
    } else {
      setErr(t("authFailed"));
    }
  };

  const reset = async () => {
    if (!email.trim() || code.trim().length < 6 || !pw || busy) {
      setErr(t("requiredFields"));
      return;
    }
    if (pw !== pw2) {
      setErr(t("pwMismatch"));
      return;
    }
    setBusy(true);
    setErr("");
    const r = await resetWriterPassword(email.trim(), code.trim(), pw);
    setBusy(false);
    if (r.data && "writer" in r.data) {
      signIn(r.data.writer, r.data.token);
      router.push("/account");
      return;
    }
    setErr(t("authFailed"));
  };

  return (
    <div className="card" style={{ padding: 20, maxWidth: 420 }}>
      <h2 style={{ fontSize: 19, margin: "0 0 14px" }}>{t("resetPwTitle")}</h2>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("email")}</label>
      <input
        className="input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        style={{ marginBottom: 12 }}
        disabled={step === "reset"}
      />
      {step === "email" ? (
        <button className="btn btn-premium" onClick={send} disabled={busy} style={{ width: "100%" }}>
          {busy ? t("loading") : t("sendResetCode")}
        </button>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>{t("checkInbox")}</p>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, margin: "12px 0 4px" }}>
            {t("verifyCode")}
          </label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            style={{ marginBottom: 12 }}
          />
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("newPwLbl")}</label>
          <div className="pw-wrap" style={{ marginBottom: 12 }}>
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
            />
            <button type="button" className="pw-eye" onClick={() => setShowPw((v) => !v)} aria-label="show password">
              <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("confirmPw")}</label>
          <div className="pw-wrap" style={{ marginBottom: 12 }}>
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button className="btn btn-premium" onClick={reset} disabled={busy} style={{ width: "100%" }}>
            {busy ? t("loading") : t("resetPwTitle")}
          </button>
        </>
      )}
      {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700 }}>{err}</p>}
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 700 }}>
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
