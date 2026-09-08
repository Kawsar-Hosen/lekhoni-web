"use client";

import { useLang } from "@/lib/i18n";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLang();
  return (
    <div className="narrow">
      <div className="empty" style={{ padding: "80px 16px" }}>
        <h1 style={{ fontSize: 22 }}>{t("errTitle")}</h1>
        <p>{t("errText")}</p>
        <button className="btn" onClick={reset} style={{ marginTop: 12 }}>
          {t("errorRetry")}
        </button>
      </div>
    </div>
  );
}
