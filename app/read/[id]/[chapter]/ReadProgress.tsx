"use client";

import { useEffect, useRef, useState } from "react";

// Thin reading-progress bar fixed to the top. Subtle, functional, no animation.
// Also records the highest chapter read per book (for chapter-list read state).
export default function ReadProgress({ bookId = "", idx = 0 }: { bookId?: string; idx?: number }) {
  const [pct, setPct] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (bookId) {
      try {
        const k = `lk-read-${bookId}`;
        const prev = parseInt(window.localStorage.getItem(k) || "-1", 10);
        if (Number.isNaN(prev) || idx > prev) window.localStorage.setItem(k, String(idx));
      } catch {}
    }
  }, [bookId, idx]);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setPct(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  if (pct <= 0) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 2,
        width: `${pct}%`,
        background: "var(--accent)",
        zIndex: 60,
      }}
    />
  );
}
