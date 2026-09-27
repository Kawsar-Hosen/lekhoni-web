"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import mqtt, { type MqttClient } from "mqtt";

type Pt = { x: number; y: number };
type Stroke = { color: string; width: number; pts: Pt[]; eraser?: boolean };

// Module scope: impure id generation stays out of the render path.
const newDrawId = () => `u-${Math.random().toString(36).slice(2, 8)}`;

const COLORS = ["#1c1917", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
const WIDTHS = [3, 6, 10];

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  if (s.pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = s.eraser ? "destination-out" : "source-over";
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s.pts[0].x * w, s.pts[0].y * h);
  for (const p of s.pts) ctx.lineTo(p.x * w, p.y * h);
  ctx.stroke();
  ctx.restore();
}

export default function DrawClient({ room: initialRoom }: { room: string }) {
  const { lang } = useLang();
  const bn = lang === "bn";
  const [room, setRoom] = useState(initialRoom);
  const [roomInput, setRoomInput] = useState("");
  const [joined, setJoined] = useState(Boolean(initialRoom));
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [eraser, setEraser] = useState(false);
  const [peers, setPeers] = useState(1);
  const [copied, setCopied] = useState(false);
  const myRef = useRef<HTMLCanvasElement>(null);
  const peerRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const peerStrokes = useRef<Stroke[]>([]);
  const drawing = useRef<Stroke | null>(null);
  const client = useRef<MqttClient | null>(null);
  const me = useRef("");

  const paintAll = useCallback(() => {
    for (const [ref, list] of [
      [myRef, strokes.current],
      [peerRef, peerStrokes.current],
    ] as const) {
      const cv = ref.current;
      if (!cv) continue;
      const ctx = cv.getContext("2d");
      if (!ctx) continue;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const s of list) drawStroke(ctx, s, cv.width, cv.height);
      if (ref === myRef && drawing.current) drawStroke(ctx, drawing.current, cv.width, cv.height);
    }
  }, []);

  const fit = useCallback(() => {
    for (const ref of [myRef, peerRef]) {
      const cv = ref.current;
      if (!cv || !cv.parentElement) continue;
      const r = cv.parentElement.getBoundingClientRect();
      cv.width = Math.max(200, Math.floor(r.width));
      cv.height = Math.max(220, Math.floor(r.width * 0.72));
    }
    paintAll();
  }, [paintAll]);

  useEffect(() => {
    if (!joined || !room) return;
    if (!me.current) me.current = newDrawId();
    fit();
    window.addEventListener("resize", fit);
    let cli: MqttClient | null = null;
    let alive = true;
    try {
      cli = mqtt.connect("wss://broker.emqx.io:8084/mqtt", { reconnectPeriod: 3000 });
      client.current = cli;
      cli.on("connect", () => {
        if (!alive || !cli) return;
        cli.subscribe(`lekhoni/draw/${room}/#`);
        cli.publish(`lekhoni/draw/${room}/hello`, JSON.stringify({ u: me.current }));
      });
      cli.on("message", (topic, buf) => {
        if (!alive) return;
        try {
          const d = JSON.parse(buf.toString());
          if (d.u === me.current) return;
          if (topic.endsWith("/hello")) {
            setPeers((p) => Math.min(p + 1, 9));
            cli?.publish(`lekhoni/draw/${room}/hi`, JSON.stringify({ u: me.current }));
            for (const s of strokes.current) cli?.publish(`lekhoni/draw/${room}/stroke`, JSON.stringify({ u: me.current, s }));
            return;
          }
          if (topic.endsWith("/hi")) {
            setPeers((p) => Math.min(p + 1, 9));
            return;
          }
          if (topic.endsWith("/stroke") && d.s) {
            peerStrokes.current = [...peerStrokes.current.slice(-300), d.s as Stroke];
            paintAll();
            return;
          }
          if (topic.endsWith("/clear")) {
            peerStrokes.current = [];
            paintAll();
          }
        } catch {}
      });
    } catch {}
    return () => {
      alive = false;
      window.removeEventListener("resize", fit);
      try {
        cli?.end();
      } catch {}
      client.current = null;
    };
  }, [joined, room, fit, paintAll]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drawing.current = { color, width, pts: [pos(e)], eraser };
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current.pts.push(pos(e));
    if (drawing.current.pts.length % 3 === 0) {
      client.current?.publish(
        `lekhoni/draw/${room}/stroke`,
        JSON.stringify({ u: me.current, s: drawing.current })
      );
    }
    paintAll();
  };

  const end = () => {
    if (!drawing.current) return;
    strokes.current = [...strokes.current.slice(-300), drawing.current];
    client.current?.publish(
      `lekhoni/draw/${room}/stroke`,
      JSON.stringify({ u: me.current, s: drawing.current })
    );
    drawing.current = null;
    paintAll();
  };

  const undo = () => {
    strokes.current = strokes.current.slice(0, -1);
    paintAll();
  };

  const clearMine = () => {
    strokes.current = [];
    paintAll();
  };

  const clearAll = () => {
    peerStrokes.current = [];
    clearMine();
    client.current?.publish(`lekhoni/draw/${room}/clear`, JSON.stringify({ u: me.current }));
  };

  const newRoom = () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoom(code);
    setPeers(1);
    peerStrokes.current = [];
    setJoined(true);
  };

  const invite = `${typeof window !== "undefined" ? window.location.origin : ""}/draw?room=${room}`;

  if (!joined) {
    return (
      <div className="draw-lobby">
        <h1>{bn ? "ড্রয়িং বোর্ড" : "Drawing Board"}</h1>
        <p>{bn ? "বন্ধুর সাথে একসাথে আঁকো" : "Draw together with friends"}</p>
        <button className="btn btn-premium" onClick={newRoom}>
          {bn ? "নতুন রুম" : "New room"}
        </button>
        <div className="draw-join">
          <input
            className="input"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase().slice(0, 8))}
            placeholder={bn ? "রুম কোড" : "Room code"}
          />
          <button
            className="btn"
            disabled={!roomInput.trim()}
            onClick={() => {
              setRoom(roomInput.trim());
              setPeers(1);
              peerStrokes.current = [];
              setJoined(true);
            }}
          >
            {bn ? "জয়েন" : "Join"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="draw-full">
      <div className="draw-top">
        <Link href="/gift" className="draw-back">
          ←
        </Link>
        <span className="draw-room" onClick={() => {
          try {
            window.navigator.clipboard.writeText(invite);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}>
          {room} · 👥{peers} {copied ? "✓" : "📋"}
        </span>
        <button className="draw-new" onClick={newRoom}>
          +
        </button>
      </div>
      <div className="draw-tools">
        <button className={!eraser ? "on" : ""} onClick={() => setEraser(false)} aria-label="Pen">✏️</button>
        <button className={eraser ? "on" : ""} onClick={() => setEraser(true)} aria-label="Eraser">🧽</button>
        <span className="draw-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className={color === c && !eraser ? "on" : ""}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
              aria-label={c}
            />
          ))}
        </span>
        <span className="draw-widths">
          {WIDTHS.map((w) => (
            <button key={w} className={width === w ? "on" : ""} onClick={() => setWidth(w)}>
              <span style={{ width: w + 6, height: w + 6 }} />
            </button>
          ))}
        </span>
        <button onClick={undo} aria-label="Undo">↩</button>
        <button onClick={clearMine} aria-label="Clear mine">🗑</button>
        <button onClick={clearAll} aria-label="Clear all">🧹</button>
      </div>
      <div className="draw-boards">
        <div className="draw-board">
          <span className="draw-tag">{bn ? "আমার বোর্ড" : "My board"}</span>
          <canvas ref={myRef} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
        </div>
        <div className="draw-board">
          <span className="draw-tag">{bn ? "বন্ধুর বোর্ড" : "Friend's board"}</span>
          <canvas ref={peerRef} />
        </div>
      </div>
    </div>
  );
}
