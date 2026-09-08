"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function ReaderControls({ bookId, index, total }: { bookId: string; index: number; total: number }) {
  const { t } = useLang();
  const [size, setSize] = useState(18);

  return (
    <>
      <div className="toolbar" role="group" aria-label={t("fontSize")}>
        <button className="icon-btn" onClick={() => setSize((s) => Math.max(14, s - 1))}>
          A−
        </button>
        <button className="icon-btn" onClick={() => setSize(18)}>
          {t("reset")}
        </button>
        <button className="icon-btn" onClick={() => setSize((s) => Math.min(26, s + 1))}>
          A＋
        </button>
        <Link className="icon-btn" href={`/book/${bookId}`}>
          ← {t("backToBook")}
        </Link>
      </div>
      <style>{`.reader{--read-size:${size}px}`}</style>
      <div className="reader-bar">
        {index > 0 ? (
          <Link className="btn btn-ghost" href={`/read/${bookId}/${index - 1}`}>
            ← {t("prevChapter")}
          </Link>
        ) : null}
        {index < total - 1 ? (
          <Link className="btn" href={`/read/${bookId}/${index + 1}`}>
            {t("nextChapter")} →
          </Link>
        ) : null}
      </div>
    </>
  );
}
