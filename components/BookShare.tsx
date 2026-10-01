"use client";

import { useState } from "react";
import Icon from "./Icon";
import { useLang } from "@/lib/i18n";

export default function BookShare({ title }: { title: string }) {
  const { t } = useLang();
  const [done, setDone] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {}
    }
    setDone(true);
    window.setTimeout(() => setDone(false), 1500);
  };

  return (
    <button
      className="icon-plain"
      onClick={share}
      aria-label={t("shareVia")}
      title={t("shareVia")}
      style={done ? { color: "var(--accent)" } : undefined}
    >
      <Icon name="share" size={19} />
    </button>
  );
}
