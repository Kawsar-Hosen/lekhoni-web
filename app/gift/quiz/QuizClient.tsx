"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import {
  fetchQuizQuestions,
  submitQuiz,
  fetchLeaderboard,
  type QuizQ,
  type QuizRow,
} from "@/lib/api";
import mqtt, { type MqttClient } from "mqtt";

const CATS = ["literature", "gk", "writers", "history", "world"] as const;
const RANGES = ["day", "week", "month", "all"] as const;

// Quiz sound effects (Web Audio, no files needed).
function playTone(freqs: number[], type: OscillatorType, dur = 0.2, gap = 0.1, vol = 0.18) {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      const t0 = ctx.currentTime + i * gap;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    });
    window.setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, freqs.length * gap * 1000 + 700);
  } catch {}
}
const correctSound = () => playTone([523.25, 659.25, 783.99, 1046.5], "sine", 0.22, 0.09);
const wrongSound = () => playTone([220, 174.61], "sawtooth", 0.28, 0.16, 0.1);

export default function QuizClient() {
  const { t } = useLang();
  const { session } = useAuth();
  const [view, setView] = useState<"cats" | "play" | "result" | "board">("cats");
  const [cat, setCat] = useState("");
  const [qs, setQs] = useState<QuizQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(-1);
  const [rightIdx, setRightIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]>("day");
  const [board, setBoard] = useState<QuizRow[]>([]);

  const pingBoard = () => {
    try {
      const cli = mqtt.connect("wss://broker.emqx.io:8084/mqtt", { reconnectPeriod: 0 });
      cli.on("connect", () => {
        cli.publish("lekhoni/quiz/scores", JSON.stringify({ t: Date.now() }));
        window.setTimeout(() => {
          try {
            cli.end();
          } catch {}
        }, 1200);
      });
    } catch {}
  };
  const who = session?.writer.id || "";
  const token = session?.token || "";

  // Realtime leaderboard refresh (shared MQTT, no polling).
  useEffect(() => {
    if (view !== "board") return;
    fetchLeaderboard(range).then(setBoard);
    let cli: MqttClient | null = null;
    try {
      cli = mqtt.connect("wss://broker.emqx.io:8084/mqtt", { reconnectPeriod: 5000 });
      cli.on("connect", () => cli?.subscribe("lekhoni/quiz/scores"));
      cli.on("message", () => {
        fetchLeaderboard(range).then(setBoard);
      });
    } catch {}
    return () => {
      try {
        cli?.end();
      } catch {}
    };
  }, [view, range]);

  const start = async (c: string) => {
    setCat(c);
    setLoading(true);
    const list = await fetchQuizQuestions(c);
    setLoading(false);
    if (!list.length) return;
    setQs(list);
    setIdx(0);
    setPicked(-1);
    setRightIdx(-1);
    setScore(0);
    setStreak(0);
    setRight(0);
    setWrong(0);
    setView("play");
  };

  const pick = async (i: number) => {
    if (picked >= 0 || busy) return;
    setPicked(i);
    setBusy(true);
    const q = qs[idx];
    const r = await submitQuiz({ qid: q.id, answer: i, streak, token });
    setBusy(false);
    const d = r.data;
    if (d && "correct" in d && "xp" in d) {
      if (typeof (d as { answer?: number }).answer === "number") {
        setRightIdx((d as { answer?: number }).answer as number);
      } else if (d.correct) {
        // Old backend doesn't send the answer index — picked IS correct.
        setRightIdx(i);
      }
      if (d.correct) {
        correctSound();
        setScore((s) => s + (d as { xp: number }).xp);
        setStreak((s) => s + 1);
        setRight((n) => n + 1);
        pingBoard();
      } else {
        wrongSound();
        setStreak(0);
        setWrong((n) => n + 1);
      }
    } else {
      wrongSound();
      setWrong((n) => n + 1);
      setStreak(0);
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) {
      setView("result");
    } else {
      setIdx(idx + 1);
      setPicked(-1);
      setRightIdx(-1);
    }
  };

  const catName = (c: string) =>
    c === "literature" ? t("catLiterature") : c === "gk" ? t("catGk") : c === "writers" ? t("catWriters") : c === "history" ? t("catHistory") : t("catWorld");

  const rangeName = (r: string) =>
    r === "day" ? t("boardDay") : r === "week" ? t("boardWeek") : r === "month" ? t("boardMonth") : t("boardAll");

  // Login required — no guest play. Real accounts only.
  if (!session) {
    return (
      <div className="quiz-gate">
        <div style={{ fontSize: 52 }}>🔒</div>
        <h1>{t("quizTitle")}</h1>
        <p>{t("quizAuthMsg")}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
          <Link href="/login?next=/gift/quiz" className="btn btn-premium" style={{ textDecoration: "none" }}>
            {t("signIn")}
          </Link>
          <Link href="/register?next=/gift/quiz" className="btn btn-ghost" style={{ textDecoration: "none" }}>
            {t("signUp")}
          </Link>
        </div>
      </div>
    );
  }

  if (view === "cats") {
    return (
      <>
        <div className="quiz-head">
          <h1>{t("quizTitle")}</h1>
          <p>{t("quizSub")}</p>
        </div>
        <div className="quiz-stats">
          <div className="card quiz-stat">
            <span>⭐</span>
            <strong>{score}</strong>
            <span>{t("yourScore")}</span>
          </div>
          <div className="card quiz-stat">
            <span>🔥</span>
            <strong>{streak}</strong>
            <span>{t("curStreak")}</span>
          </div>
        </div>
        <h2 className="quiz-h">{t("quizCats")}</h2>
        <div className="quiz-cats">
          {CATS.map((c) => (
            <button key={c} className="card quiz-cat" onClick={() => start(c)} disabled={loading}>
              {catName(c)}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => setView("board")} style={{ width: "100%", marginTop: 14 }}>
          🏆 {t("viewBoard")}
        </button>
        {loading && (
          <div className="loading-wrap" style={{ padding: 20 }}>
            <span className="spinner" />
          </div>
        )}
      </>
    );
  }

  if (view === "play") {
    const q = qs[idx];
    if (!q) return null;
    return (
      <>
        <div className="quiz-prog">
          {t("qOf")} {idx + 1}/{qs.length} · ⭐ {score} · 🔥 {streak}
        </div>
        <div className="card quiz-q">
          <h2>{q.q}</h2>
          <div className="quiz-opts">
            {q.options.map((o, i) => {
              let cls = "";
              if (picked >= 0 && !busy) {
                if (i === rightIdx) cls = "ok";
                else if (i === picked) cls = "bad";
              } else if (i === picked) {
                cls = "pick";
              }
              return (
                <button
                  key={i}
                  className={`quiz-opt ${cls}`}
                  onClick={() => pick(i)}
                  disabled={picked >= 0}
                >
                  <span className="quiz-letter">{["A", "B", "C", "D"][i]}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {picked >= 0 && !busy && (
            <button className="btn btn-premium" onClick={next} style={{ width: "100%", marginTop: 14 }}>
              {idx + 1 >= qs.length ? t("challengeDone") : t("nextQ")} →
            </button>
          )}
        </div>
      </>
    );
  }

  if (view === "result") {
    return (
      <div className="quiz-result">
        <div style={{ fontSize: 52 }}>🎉</div>
        <h1>{t("challengeDone")}</h1>
        <div className="card quiz-score-card">
          <div className="quiz-big">{score} XP</div>
          <div className="quiz-nums">
            <span>
              ✅ {right} {t("correctLbl")}
            </span>
            <span>
              ❌ {wrong} {t("wrongLbl")}
            </span>
            <span>
              🔥 {streak} {t("curStreak")}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="btn btn-premium" onClick={() => start(cat)}>
            {t("playAgain")}
          </button>
          <button className="btn btn-ghost" onClick={() => setView("board")}>
            {t("viewBoard")}
          </button>
        </div>
      </div>
    );
  }

  const me = who;
  // Hide legacy guest rows (dev-*) until the backend JOIN deploys.
  const realBoard = board.filter((row) => !row.who.startsWith("dev-"));
  return (
    <>
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>🏆 {t("boardTitle")}</h2>
      </div>
      <div className="quiz-tabs">
        {RANGES.map((r) => (
          <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>
            {rangeName(r)}
          </button>
        ))}
      </div>
      <div className="quiz-board">
        {realBoard.map((row, i) => (
          <div key={`${row.who}-${i}`} className={`quiz-row${row.who === me ? " me" : ""}`}>
            <span className="quiz-rank">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
            </span>
            <span className="quiz-ava">{(row.name || "?")[0]?.toUpperCase()}</span>
            <span className="quiz-who">{row.name}</span>
            <strong className="quiz-xp">{row.xp} XP</strong>
          </div>
        ))}
        {!realBoard.length && <div className="empty">{t("noResults")}</div>}
      </div>
      <button className="btn btn-ghost" onClick={() => setView("cats")} style={{ width: "100%", marginTop: 14 }}>
        {t("playAgain")}
      </button>
    </>
  );
}
