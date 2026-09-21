"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import SocialIcon from "@/components/SocialIcons";
import { fetchReferral, type ReferralInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export default function ShareMenu({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const { session } = useAuth();
  const [ref, setRef] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState("");
  const [showHow, setShowHow] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchReferral(session.token).then((r) => {
      if (r.data && "code" in r.data) setRef(r.data);
    });
  }, [session]);

  const copy = async (text: string, which: string) => {
    try {
      await window.navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setCopied(which);
    window.setTimeout(() => setCopied(""), 1600);
  };

  const siteUrl = "https://www.xyteee.com/";

  if (!session) {
    const share = async () => {
      const data = { title: "Lekhoni Kahini", text: t("guestShareTx"), url: siteUrl };
      try {
        if (window.navigator.share) {
          await window.navigator.share(data);
          return;
        }
      } catch {}
      copy(siteUrl, "link");
    };
    return (
      <div className="share-box">
        <div className="menu-label">{t("shareVia")}</div>
        <p className="share-sub">{t("guestShareTx")}</p>
        <div className="share-row">
          <a
            className="share-app"
            href={`https://wa.me/?text=${encodeURIComponent(`${t("guestShareTx")} ${siteUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            <SocialIcon name="whatsapp" size={20} />
          </a>
          <a
            className="share-app"
            href={`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(t("guestShareTx"))}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
          >
            <SocialIcon name="telegram" size={20} />
          </a>
          <a
            className="share-app"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            <SocialIcon name="facebook" size={20} />
          </a>
          <a
            className="share-app"
            href={`https://x.com/intent/post?text=${encodeURIComponent(t("guestShareTx"))}&url=${encodeURIComponent(siteUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="X"
          >
            <SocialIcon name="x" size={18} />
          </a>
          <a
            className="share-app"
            href={`fb-messenger://share?link=${encodeURIComponent(siteUrl)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Messenger"
          >
            <SocialIcon name="messenger" size={20} />
          </a>
          <button className="share-app" onClick={share} aria-label={t("copyLink")}>
            <Icon name="edit" size={18} />
          </button>
        </div>
        {copied && <p className="share-copied">{t("copiedMsg")}</p>}
      </div>
    );
  }

  const link = ref ? `https://www.xyteee.com/register?ref=${ref.code}` : siteUrl;
  const wa = ref
    ? `https://wa.me/?text=${encodeURIComponent(`${t("shareSub")} ${link}`)}`
    : "";
  const tg = ref
    ? `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t("shareSub"))}`
    : "";

  return (
    <div className="share-box">
      <div className="share-head">
        <strong>
          {t("shareTitle")}{" "}
          <button
            className="how-q"
            onClick={() => setShowHow((v) => !v)}
            aria-label={t("howRefT")}
            title={t("howRefT")}
          >
            ?
          </button>
        </strong>
        <p>{t("shareSub")}</p>
      </div>
      {showHow && (
        <>
          <div className="menu-label">{t("howRefT")}</div>
          <ol className="share-steps">
            <li>{t("howRef1")}</li>
            <li>{t("howRef2")}</li>
            <li>{t("howRef3")}</li>
          </ol>
        </>
      )}
      {!ref ? (
        <div className="loading-wrap" style={{ padding: 20 }}>
          <span className="spinner" />
        </div>
      ) : (
        <>
          <div className="menu-label">{t("myRefLink")}</div>
          <div className="share-linkbox">{link}</div>
          <div className="share-row">
            <button className="mini-btn" onClick={() => copy(link, "link")}>
              {copied === "link" ? t("copiedMsg") : t("copyLink")}
            </button>
            <button className="mini-btn" onClick={() => copy(ref.code, "code")}>
              {copied === "code" ? t("copiedMsg") : `${t("copyCode")}: ${ref.code}`}
            </button>
          </div>
          <div className="menu-label">{t("shareVia")}</div>
          <div className="share-row">
            <a className="share-app" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <SocialIcon name="whatsapp" size={20} />
            </a>
            <a className="share-app" href={tg} target="_blank" rel="noreferrer" aria-label="Telegram">
              <SocialIcon name="telegram" size={20} />
            </a>
            <a
              className="share-app"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <SocialIcon name="facebook" size={20} />
            </a>
            <a
              className="share-app"
              href={`https://x.com/intent/post?text=${encodeURIComponent(t("shareSub"))}&url=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="X"
            >
              <SocialIcon name="x" size={18} />
            </a>
            <a
              className="share-app"
              href={`fb-messenger://share?link=${encodeURIComponent(link)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Messenger"
            >
              <SocialIcon name="messenger" size={20} />
            </a>
            <button className="share-app" onClick={() => copy(link, "link2")} aria-label={t("copyLink")}>
              <Icon name="edit" size={18} />
            </button>
          </div>
          <div className="share-stats">
            <span>
              <strong>{ref.uses}</strong> {t("refUses")}
            </span>
            <span>
              <strong>৳{ref.earnings}</strong> {t("refEarnings")}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
