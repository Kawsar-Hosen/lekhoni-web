"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import GiftIcon from "@/components/GiftIcon";
import { GIFT_TEMPLATES, type GiftTpl } from "@/lib/gift-templates";

function chime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.45);
    });
    window.setTimeout(() => ctx.close(), 900);
  } catch {}
}

function Particles() {
  return null;
}

export default function GiftClient() {
  const { t, lang } = useLang();
  const bn = lang === "bn";
  const [hub, setHub] = useState<"home" | "letter" | "spin">("home");
  const [step, setStep] = useState<"pick" | "make" | "sealed" | "open">("pick");
  const [tpl, setTpl] = useState<GiftTpl>(GIFT_TEMPLATES[0]);
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");

  const share = async () => {
    const text = `${to ? `To: ${to}\n` : ""}${msg}`;
    try {
      if (window.navigator.share) {
        await window.navigator.share({ title: t("giftSend"), text });
        return;
      }
      await window.navigator.clipboard.writeText(text);
    } catch {}
  };

  const css = {
    ["--gift-bg" as string]: tpl.bg,
    ["--gift-deep" as string]: tpl.bgDeep,
    ["--gift-ac" as string]: tpl.accent,
    ["--gift-paper" as string]: tpl.paper,
    ["--gift-ink" as string]: tpl.ink,
  };

  return (
    <div className="gift-wrap gift-hub">
      {hub === "home" && (
        <>
          <div className="gift-hub-hero gift-hub-banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gift-banner.png" alt="" />
          </div>
          <div className="gift-hub-grid">
            <button className="gift-hub-card hub-love" onClick={() => setHub("letter")}>
              <span className="gift-hub-ic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/love-badge.png" alt="" className="gift-hub-badge" />
              </span>
              <strong>{bn ? "লাভ লেটার" : "Love Letter"}</strong>
              <span>{bn ? "১০টি ডিজাইন" : "10 designs"}</span>
            </button>
            <button className="gift-hub-card hub-draw" onClick={() => setHub("spin")}>
              <span className="gift-hub-ic">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/draw-badge.png" alt="" className="gift-hub-badge" />
              </span>
              <strong>{bn ? "ড্রয়িং বোর্ড" : "Drawing Board"}</strong>
              <span>{bn ? "বন্ধুর সাথে আঁকো" : "Draw with friends"}</span>
            </button>
            <Link href="/gift/quiz" className="gift-hub-card hub-quiz" style={{ textDecoration: "none" }}>
              <span className="gift-hub-ic">🧠</span>
              <strong>{bn ? "প্রশ্ন চ্যালেঞ্জ" : "Quiz Challenge"}</strong>
              <span>{bn ? "জ্ঞান যাচাই করো" : "Test your knowledge"}</span>
            </Link>
          </div>
        </>
      )}

      {hub === "spin" && (
        <div className="gift-spin">
          <button className="gift-back" onClick={() => setHub("home")}>
            ← {bn ? "পেছনে" : "Back"}
          </button>
          <h1 className="gift-h">{bn ? "ড্রয়িং বোর্ড" : "Drawing Board"}</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
            {bn ? "নিচের বাটনে পুরো পেজে আঁকো" : "Open full page to draw"}
          </p>
          <Link
            href="/draw"
            className="btn btn-premium spin-go"
            style={{ textDecoration: "none" }}
          >
            {bn ? "বোর্ড খোলো" : "Open board"}
          </Link>
        </div>
      )}

      {hub === "letter" && (
        <>
          <button className="gift-back" onClick={() => setHub("home")}>
            ← {bn ? "পেছনে" : "Back"}
          </button>
      {step === "pick" && (
        <>
          <h1 className="gift-h">{bn ? "চিঠির ডিজাইন বেছে নিন" : "Choose a letter design"}</h1>
          <div className="gift-grid">
            {GIFT_TEMPLATES.map((g) => (
              <button
                key={g.id}
                className={`gift-tpl${tpl.id === g.id ? " on" : ""}`}
                onClick={() => {
                  setTpl(g);
                  setStep("make");
                }}
              >
                <span
                  className="gift-mini"
                  style={{ background: g.bg, color: g.accent }}
                >
                  <span className="gift-mini-flap" />
                  <span className="gift-mini-seal">
                    <GiftIcon name={g.seal} size={24} />
                  </span>
                </span>
                <strong>{bn ? g.nameBn : g.nameEn}</strong>
                <span>{bn ? g.descBn : g.descEn}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "make" && (
        <div className="card gift-card">
          <button className="gift-back" onClick={() => setStep("pick")}>
            ← {bn ? "ডিজাইন" : "Designs"}
          </button>
          <div className="gift-chosen" style={css}>
            <span>{tpl.emoji}</span> {bn ? tpl.nameBn : tpl.nameEn}
          </div>
          <label className="fld-lb">{t("giftTo")}</label>
          <input
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            maxLength={40}
            style={{ marginBottom: 12 }}
          />
          <label className="fld-lb">{t("giftSend")}</label>
          <textarea
            className="textarea"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={t("giftMsg")}
            style={{ minHeight: 150 }}
          />
          <button
            className="btn gift-go"
            disabled={!msg.trim()}
            onClick={() => setStep("sealed")}
            style={{ width: "100%", marginTop: 12, background: tpl.btnBg, color: tpl.btnInk, border: "none" }}
          >
            {t("giftOpen")} →
          </button>
        </div>
      )}

      {step !== "pick" && step !== "make" && (
        <div className={`gift-stage${step === "open" ? " open" : ""}`}>
          <div
            className={`gift-env tpl-${tpl.id} open-${tpl.open} shape-${tpl.shape}${step === "open" ? " open" : ""}`}
            style={css}
            onClick={() => {
              if (step === "sealed") {
                chime();
                setStep("open");
              }
            }}
          >
            <Particles />
            <div className="gift-flap" />
            <div className="gift-pocket" />
            <div className="gift-letter">
              <strong>{to || "…"}</strong>
              <p>{msg}</p>
            </div>
            {step === "sealed" && (
              <span className="gift-seal" style={{ color: tpl.accent }}>
                <GiftIcon name={tpl.seal} size={42} />
              </span>
            )}
          </div>
          {step === "sealed" && <p className="gift-hint">{t("giftOpen")} 👆</p>}
          {step === "open" && (
            <>
              <p className="gift-made">{t("giftMade")}</p>
              <div className="gift-actions">
                <button
                  className="btn"
                  onClick={share}
                  style={{ background: tpl.btnBg, color: tpl.btnInk, border: "none" }}
                >
                  {t("giftShare")}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setStep("pick");
                    setTo("");
                    setMsg("");
                  }}
                >
                  {t("giftNew")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
