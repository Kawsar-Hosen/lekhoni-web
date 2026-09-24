"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { useLang } from "@/lib/i18n";

export default function ReaderControls({
  bookId,
  bookTitle,
  index,
  total,
}: {
  bookId: string;
  bookTitle: string;
  index: number;
  total: number;
}) {
  const { t, lang } = useLang();
  const [size, setSize] = useState(18);
  const [fs, setFs] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [auto, setAuto] = useState(false);
  const [showParts, setShowParts] = useState(false);
  const autoRef = useRef(0);

  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
  };

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    // Preload TTS voices (some browsers load them async).
    try {
      const synth = window.speechSynthesis;
      synth?.getVoices();
      if (synth && typeof synth.onvoiceschanged !== "undefined") {
        synth.onvoiceschanged = () => synth.getVoices();
      }
    } catch {}
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      try {
        window.speechSynthesis?.cancel();
      } catch {}
      window.clearInterval(autoRef.current);
    };
  }, []);

  const stopVoice = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setSpeaking(false);
  };

  const pickVoice = (synth: SpeechSynthesis, code: string): SpeechSynthesisVoice | null => {
    try {
      const vs = synth.getVoices();
      if (!vs.length) return null;
      const short = code.split("-")[0].toLowerCase();
      return (
        vs.find((v) => v.lang?.toLowerCase().startsWith(short)) ||
        vs.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
        vs[0]
      );
    } catch {
      return null;
    }
  };

  const toggleVoice = () => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (speaking) {
        stopVoice();
        return;
      }
      const raw = document.querySelector(".reader")?.textContent?.replace(/\s+/g, " ").trim() || "";
      if (!raw) return;
      const code = lang === "bn" ? "bn-BD" : "en-US";
      // Chrome desktop cuts long utterances — split into sentence chunks.
      const parts = raw.match(/[^।!?.\n]+[।!?.\n]+|[^।!?.\n]+$/g) || [raw];
      const chunks: string[] = [];
      let cur = "";
      for (const p of parts) {
        if ((cur + p).length > 220) {
          if (cur.trim()) chunks.push(cur.trim());
          cur = p;
        } else {
          cur += p;
        }
      }
      if (cur.trim()) chunks.push(cur.trim());
      synth.cancel();
      const voice = pickVoice(synth, code);
      chunks.slice(0, 60).forEach((text, i, arr) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = code;
        if (voice) u.voice = voice;
        u.rate = 0.95;
        if (i === arr.length - 1) {
          u.onend = () => setSpeaking(false);
          u.onerror = () => setSpeaking(false);
        }
        synth.speak(u);
      });
      setSpeaking(true);
    } catch {}
  };

  const toggleAuto = () => {
    window.clearInterval(autoRef.current);
    if (auto) {
      setAuto(false);
      return;
    }
    setAuto(true);
    autoRef.current = window.setInterval(() => {
      window.scrollBy({ top: 2, behavior: "auto" });
      const el = document.documentElement;
      if (el.scrollHeight - el.clientHeight - window.scrollY < 4) {
        window.clearInterval(autoRef.current);
        setAuto(false);
      }
    }, 50);
  };

  return (
    <>
      <style>{`.reader{--read-size:${size}px}`}</style>
      <div className="rd-top">
        <Link href={`/book/${bookId}`} className="rd-back" aria-label={t("backToBook")}>
          <Icon name="chevL" size={16} />
        </Link>
        <div className="rd-title">
          <span className="rd-book">{bookTitle}</span>
          {total > 1 && (
            <span className="rd-ch">
              {t("chapterWord")} {index + 1} {t("ofWord")} {total}
            </span>
          )}
        </div>
        <div className="rd-font" role="group" aria-label={t("fontSize")}>
          <button onClick={() => setSize((s) => Math.max(14, s - 1))} aria-label={t("decrease")}>
            A−
          </button>
          <button onClick={() => setSize(18)} aria-label={t("reset")} className="rd-reset">
            A
          </button>
          <button onClick={() => setSize((s) => Math.min(26, s + 1))} aria-label={t("increase")}>
            A＋
          </button>
          <button onClick={toggleFs} aria-label="Fullscreen" title="Fullscreen" style={fs ? { color: "var(--accent)" } : undefined}>
            <Icon name="expand" size={14} />
          </button>
        </div>
      </div>

      <div className="rd-float">
        <button
          className={`rd-ic${speaking ? " on" : ""}`}
          onClick={toggleVoice}
          aria-label={t("listenBtn")}
          title={t("listenBtn")}
        >
          <Icon name="volume" size={16} />
        </button>
        <button
          className={`rd-ic${auto ? " on" : ""}`}
          onClick={toggleAuto}
          aria-label={t("autoScrollBtn")}
          title={t("autoScrollBtn")}
        >
          <Icon name="scroll" size={16} />
        </button>
        <button
          className={`rd-ic${showParts ? " on" : ""}`}
          onClick={() => setShowParts((v) => !v)}
          aria-label={t("chapters")}
          title={t("chapters")}
        >
          <Icon name="grid" size={16} />
        </button>
        {index > 0 ? (
          <Link className="rd-btn" href={`/read/${bookId}/${index - 1}`}>
            <Icon name="chevL" size={16} /> {t("prevChapter")}
          </Link>
        ) : (
          <Link className="rd-btn" href={`/book/${bookId}`}>
            <Icon name="chevL" size={16} /> {t("backToBook")}
          </Link>
        )}
        <span className="rd-pg">
          {total > 1 ? `${index + 1}/${total}` : "•"}
        </span>
        {index < total - 1 ? (
          <Link className="rd-btn primary" href={`/read/${bookId}/${index + 1}`}>
            {t("nextChapter")} <Icon name="chevR" size={16} />
          </Link>
        ) : (
          <Link className="rd-btn primary" href={`/book/${bookId}`}>
            ✓
          </Link>
        )}
      </div>
      {showParts && total > 1 && (
        <div className="card rd-parts">
          <div className="rd-parts-h">
            {t("chapters")} ({total})
          </div>
          <div className="rd-parts-grid">
            {Array.from({ length: total }, (_, i) => (
              <Link
                key={i}
                href={`/read/${bookId}/${i}`}
                className={i === index ? "rd-part on" : "rd-part"}
              >
                {i + 1} {t("episodes")}
              </Link>
            ))}
          </div>
        </div>
      )}

    </>
  );
}
