"use client";

import { useEffect, useRef, useState } from "react";

// Thin reading-progress bar fixed to the top. Subtle, functional, no animation.
export default function ReadProgress() {
  const [pct, setPct] = useState(0);
  const raf = useRef(0);

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
