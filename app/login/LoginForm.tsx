"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import GoogleButton from "@/components/GoogleButton";
import { writerLogin } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export default function LoginForm() {
  const { t } = useLang();
  const { signIn } = useAuth();
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!id.trim() || !pw || busy) {
      setErr(t("requiredFields"));
      return;
    }
    setBusy(true);
    setErr("");
    const r = await writerLogin(id.trim(), pw);
    setBusy(false);
    if (!r) {
      setErr(t("authFailed"));
      return;
    }
    if ("writer" in r) {
      signIn(r.writer, r.token);
      router.push("/account");
      return;
    }
    if ("unverified" in r) {
      router.push(`/register?verify=${encodeURIComponent(r.email)}`);
      return;
    }
    setErr(t("authFailed"));
  };

  return (
    <div className="card" style={{ padding: 20, maxWidth: 420 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
        {t("email")} / {t("username")}
      </label>
      <input className="input" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" style={{ marginBottom: 12 }} />
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t("password")}</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          type={showPw ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button type="button" className="icon-btn" onClick={() => setShowPw((v) => !v)} aria-label="show password">
          <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
        </button>
      </div>
      {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700 }}>{err}</p>}
      <button className="btn" onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 6 }}>
        {t("signIn")}
      </button>
      <GoogleButton />
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
        {t("noAccount")}{" "}
        <Link href="/register" style={{ color: "var(--accent)", fontWeight: 700 }}>
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}
