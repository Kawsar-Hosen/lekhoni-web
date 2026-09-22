"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { writerGoogleAuth } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

// Google Identity Services official button (renders the original Google "G").
// Requires the site origin whitelisted in Google Cloud Console for this client.
const GOOGLE_CLIENT_ID =
  "940343114841-pd5po6gp5dij90nlp5k28tigp5qqr1rt.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
          renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleButton({ referral }: { referral?: string }) {
  const { signIn } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("gis"));
        document.head.appendChild(s);
      });
    loadScript()
      .then(() => {
        if (!on || !btnRef.current || !window.google) return;
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (resp) => {
              if (!resp?.credential) {
                setErr(t("authFailed"));
                return;
              }
              const r = await writerGoogleAuth(resp.credential, referral || undefined);
              if (!r.data) {
                setErr(t("authFailed"));
                return;
              }
              if ("writer" in r.data) {
                signIn(r.data.writer, r.data.token);
                router.push("/account");
              } else {
                setErr(t("authFailed"));
              }
            },
          });
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: document.documentElement.dataset.theme === "dark" ? "filled_black" : "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 320,
            locale: lang === "bn" ? "bn" : "en",
          });
          setReady(true);
        } catch {
          setErr(t("authFailed"));
        }
      })
      .catch(() => setErr(t("authFailed")));
    return () => {
      on = false;
    };
  }, [lang, router, signIn, t, referral]);

  return (
    <div style={{ marginTop: 12 }}>
      <div
        ref={btnRef}
        style={{ display: "flex", justifyContent: "center", minHeight: ready ? undefined : 0 }}
      />
      {!ready && !err && (
        <div className="btn btn-ghost" style={{ width: "100%", pointerEvents: "none" }}>
          {t("continueWithGoogle")}
        </div>
      )}
      {err && <p style={{ color: "red", fontSize: 13, fontWeight: 700, textAlign: "center" }}>{err}</p>}
    </div>
  );
}
