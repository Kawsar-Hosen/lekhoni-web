"use client";

import { useEffect, useRef, useState } from "react";
import { sendAiMessage, AiError, aiErrorKey, type AiMsg } from "@/lib/ai";
import { useLang } from "@/lib/i18n";

type Phase = "listening" | "thinking" | "speaking" | "error";

// Strip markdown so TTS speaks clean natural text.
function stripMd(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/__([^_]*)__/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~#>|]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 1200);
}

type Recog = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function makeRecog(locale: string): Recog | null {
  try {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => Recog }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => Recog }).webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = locale;
    rec.continuous = false;
    rec.interimResults = true;
    return rec;
  } catch {
    return null;
  }
}

function pickTtsVoice(synth: SpeechSynthesis, lang: string): SpeechSynthesisVoice | null {
  try {
    const vs = synth.getVoices();
    const prefix = lang === "bn" ? "bn" : "en";
    return (
      vs.find((x) => x.lang?.toLowerCase().startsWith(prefix) && x.localService) ||
      vs.find((x) => x.lang?.toLowerCase().startsWith(prefix)) ||
      null
    );
  } catch {
    return null;
  }
}

export default function VoiceMode({
  seed,
  onExchange,
  onClose,
}: {
  seed: AiMsg[];
  onExchange: (user: string, ai: string) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const bn = lang === "bn";
  const [phase, setPhase] = useState<Phase>("listening");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");

  const phaseRef = useRef<Phase>("listening");
  const openRef = useRef(true);
  const histRef = useRef<AiMsg[]>(seed.slice(-10));
  const exchRef = useRef(onExchange);
  const closeRef = useRef(onClose);
  const recRef = useRef<Recog | null>(null);
  const finalRef = useRef("");
  const locale = bn ? "bn-BD" : "en-US";

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    exchRef.current = onExchange;
    closeRef.current = onClose;
  });

  const stopRec = () => {
    try {
      recRef.current?.abort();
    } catch {}
    recRef.current = null;
  };

  const stopSpeak = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  };

  const speak = (text: string) => {
    if (!openRef.current) return;
    const clean = stripMd(text);
    if (!clean) {
      listen();
      return;
    }
    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        listen();
        return;
      }
      stopRec();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = locale;
      const v = pickTtsVoice(synth, lang);
      if (v) u.voice = v;
      u.rate = 1;
      u.onend = () => {
        if (openRef.current && phaseRef.current === "speaking") listen();
      };
      u.onerror = () => {
        if (openRef.current && phaseRef.current === "speaking") listen();
      };
      setPhaseBoth("speaking");
      synth.cancel();
      synth.speak(u);
    } catch {
      listen();
    }
  };

  const think = async (text: string) => {
    if (!openRef.current) return;
    setPhaseBoth("thinking");
    setReply("");
    try {
      const answer = await sendAiMessage([...histRef.current, { role: "user" as const, text }]);
      if (!openRef.current) return;
      histRef.current = [...histRef.current, { role: "user" as const, text }, { role: "ai" as const, text: answer }].slice(-12);
      setReply(answer);
      exchRef.current(text, answer);
      speak(answer);
    } catch (e) {
      if (!openRef.current) return;
      // Speak the real reason (quota finished / offline / slow net).
      const code = e instanceof AiError ? e.code : "unknown";
      speak(t(aiErrorKey(code)));
    }
  };

  const listen = () => {
    if (!openRef.current) return;
    stopSpeak();
    stopRec();
    const rec = makeRecog(locale);
    if (!rec) {
      setPhaseBoth("error");
      return;
    }
    finalRef.current = "";
    setHeard("");
    recRef.current = rec;
    setPhaseBoth("listening");
    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (const r of e.results) {
        if (r.isFinal) final += r[0]?.transcript || "";
        else interim += r[0]?.transcript || "";
      }
      const show = (final + interim).trim();
      if (show) setHeard(show);
      if (final.trim()) {
        finalRef.current = final.trim();
        try {
          rec.stop();
        } catch {}
      }
    };
    rec.onerror = (e) => {
      if (!openRef.current) return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setPhaseBoth("error");
        return;
      }
      // no-speech / network blips: keep the loop alive.
      if (phaseRef.current === "listening") {
        window.setTimeout(() => {
          if (openRef.current && phaseRef.current === "listening") listen();
        }, 400);
      }
    };
    rec.onend = () => {
      if (!openRef.current) return;
      const said = finalRef.current;
      if (said) {
        finalRef.current = "";
        think(said);
      } else if (phaseRef.current === "listening") {
        listen();
      }
    };
    try {
      rec.start();
    } catch {
      if (openRef.current && phaseRef.current === "listening") {
        window.setTimeout(() => {
          if (openRef.current && phaseRef.current === "listening") listen();
        }, 400);
      }
    }
  };

  // Tap orb = barge in: stop AI speech, go back to listening.
  const bargeIn = () => {
    if (phaseRef.current === "speaking") {
      stopSpeak();
      listen();
    }
  };

  const close = () => {
    openRef.current = false;
    stopRec();
    stopSpeak();
    closeRef.current();
  };

  useEffect(() => {
    openRef.current = true;
    listen();
    return () => {
      openRef.current = false;
      try {
        recRef.current?.abort();
      } catch {}
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status =
    phase === "listening"
      ? t("vListening")
      : phase === "thinking"
        ? t("vThinking")
        : phase === "speaking"
          ? t("vSpeaking")
          : t("vNoSupport");

  return (
    <div className="vmode" role="dialog" aria-modal="true" aria-label="Voice">
      <div className="vmode-aurora" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className={`vmode-status vmode-${phase}`}>
        <span className="vmode-dot" />
        {status}
      </div>

      <button className={`vmode-orb vmode-orb-${phase}`} onClick={bargeIn} aria-label="Tap to interrupt">
        <span className="vmode-ring" />
        <span className="vmode-ring" />
        <span className="vmode-core">
          {phase === "speaking" ? (
            <span className="vmode-eq" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} style={{ animationDelay: `${i * 0.13}s` }} />
              ))}
            </span>
          ) : phase === "thinking" ? (
            <span className="vmode-spin" aria-hidden="true" />
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </span>
      </button>

      <div className="vmode-texts">
        {heard ? <p className="vmode-heard">{heard}</p> : null}
        {reply ? <p className="vmode-reply">{stripMd(reply).slice(0, 220)}</p> : null}
      </div>

      <p className="vmode-hint">{t("vTapStop")}</p>
      <button className="vmode-end" onClick={close}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
          <line x1="23" y1="1" x2="1" y2="23" />
        </svg>
        {t("vEnd")}
      </button>
    </div>
  );
}
