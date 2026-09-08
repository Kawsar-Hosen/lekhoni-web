"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
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
          <Icon name="chevL" size={14} /> {t("backToBook")}
        </Link>
      </div>
      <style>{`.reader{--read-size:${size}px}`}</style>
      <div className="reader-bar">
        {index > 0 ? (
          <Link className="btn btn-ghost" href={`/read/${bookId}/${index - 1}`}>
            <Icon name="chevL" size={15} /> {t("prevChapter")}
          </Link>
        ) : null}
        {index < total - 1 ? (
          <Link className="btn" href={`/read/${bookId}/${index + 1}`}>
            {t("nextChapter")} <Icon name="chevR" size={15} />
          </Link>
        ) : null}
      </div>
    </>
  );
}
