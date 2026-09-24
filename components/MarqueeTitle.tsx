"use client";

import { useEffect, useRef, useState } from "react";

export default function MarqueeTitle({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [over, setOver] = useState(false);
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const d = el.scrollWidth - el.clientWidth;
      setOver(d > 8);
      setDist(d);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [text]);

  if (!over) {
    return (
      <span ref={ref} className="nb-title">
        {text}
      </span>
    );
  }
  const secs = Math.max(4, dist / 18);
  return (
    <span className="nb-marq">
      <span
        ref={ref}
        className="nb-marq-in"
        style={{ ["--mq-dist" as string]: `${dist}px`, ["--mq-secs" as string]: `${secs}s` }}
      >
        {text}
      </span>
    </span>
  );
}
