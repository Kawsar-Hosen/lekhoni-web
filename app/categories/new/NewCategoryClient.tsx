"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { createCategory } from "@/lib/api";

const REQ_KEY = "lk-cat-requests";

function loadReqs(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(REQ_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function NewCategoryClient() {
  const { t } = useLang();
  const { session, ready } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reqs, setReqs] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : loadReqs()
  );

  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
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
    if (!name.trim() || busy) {
      setOk(false);
      setMsg(t("requiredFields"));
      return;
    }
    setBusy(true);
    setMsg("");
    const r = await createCategory(session.token, name.trim());
    setBusy(false);
    if (r.data && "id" in r.data) {
      setOk(true);
      setMsg(t("catWaiting"));
      const next = [name.trim(), ...loadReqs()].slice(0, 20);
      try {
        window.localStorage.setItem(REQ_KEY, JSON.stringify(next));
      } catch {}
      setReqs(next);
      setName("");
    } else {
      setOk(false);
      const err = r.data && "error" in r.data ? String(r.data.error) : "";
      setMsg(err === "Category already exists" ? t("categoryExists") : t("authFailed"));
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <p className="wiz-hint">{t("catHint")}</p>
      <label className="fld-lb">{t("newCategory")}</label>
      <input
        className="input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        style={{ marginBottom: 12 }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      {msg && <p style={{ color: ok ? "green" : "red", fontSize: 13, fontWeight: 700 }}>{msg}</p>}
      <button className="btn btn-premium" onClick={submit} disabled={busy}>
        {busy ? t("loading") : t("newCategory")}
      </button>
      {reqs.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, margin: "20px 0 10px" }}>{t("myRequests")}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {reqs.map((n, i) => (
              <span key={`${n}-${i}`} className="chip">
                {n} · <span style={{ color: "#b45309", fontWeight: 800 }}>{t("pendingSt")}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
