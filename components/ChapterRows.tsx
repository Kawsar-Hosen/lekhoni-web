"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import { useLang } from "@/lib/i18n";

// Numbered chapter rows with real read-state (highest chapter opened, per device)
// and a slim overall progress bar.
export default function ChapterRows({ bookId, count }: { bookId: string; count: number }) {
  const { t } = useLang();
  const [read, setRead] = useState(-1);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const v = parseInt(window.localStorage.getItem(`lk-read-${bookId}`) || "-1", 10);
        if (!Number.isNaN(v)) setRead(v);
      } catch {}
    }, 0);
    return () => window.clearTimeout(id);
  }, [bookId]);

  const done = Math.min(Math.max(read + 1, 0), count);
  const pct = count > 0 ? Math.round((done / count) * 100) : 0;

  return (
    <>
      {done > 0 && (
        <div className="ch-prog" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
      <ol className="chapter-list">
        {Array.from({ length: count }, (_, i) => {
          const isRead = i <= read;
          return (
            <li key={i}>
              <Link href={`/read/${bookId}/${i}`} style={{ width: "100%" }}>
                <span className={`n${isRead ? " done" : ""}`}>{isRead ? "✓" : i + 1}</span>
                <span className="ch-tt">
                  {i + 1} {t("episodes")}
                </span>
                <Icon name="chevR" size={16} />
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
