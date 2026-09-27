"use client";

import { useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

type Tok = { t: string; c?: string };

const KW: Record<string, Set<string>> = {
  js: new Set(
    "const let var function return if else for while do switch case break continue new class extends import from export default try catch finally throw typeof instanceof in of await async this true false null undefined void delete yield static get set".split(
      " "
    )
  ),
  css: new Set(
    "color background margin padding border display flex grid position font size width height".split(" ")
  ),
  py: new Set(
    "def return if elif else for while in not and or is None True False class import from as with try except finally raise lambda pass break continue global print".split(
      " "
    )
  ),
};

const fam = (lang: string): "html" | "css" | "py" | "js" => {
  const l = lang.toLowerCase();
  if (["html", "xml", "svg", "vue"].includes(l)) return "html";
  if (["css", "scss", "less"].includes(l)) return "css";
  if (["python", "py"].includes(l)) return "py";
  return "js";
};

// Generic tokenizer: comments, strings, numbers, words, other.
function tokenizeGeneric(code: string, keywords: Set<string>): Tok[] {
  const re =
    /(\/\*[\s\S]*?(?:\*\/|$))|(\/\/[^\n]*)|(#[^\n]*)|(`(?:[^`\\]|\\.)*(?:`|$))|('(?:[^'\\\n]|\\.)*(?:'|$))|("(?:[^"\\\n]|\\.)*(?:"|$))|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const [full, blockC, lineC, hashC, tpl, sq, dq, num, word, ws, other] = m;
    if (blockC || lineC || hashC) out.push({ t: full, c: "tk-c" });
    else if (tpl || sq || dq) out.push({ t: full, c: "tk-s" });
    else if (num) out.push({ t: full, c: "tk-n" });
    else if (word) {
      const rest = code.slice(re.lastIndex);
      const isCall = /^\s*\(/.test(rest);
      out.push({ t: full, c: keywords.has(full) ? "tk-k" : isCall ? "tk-f" : undefined });
    } else if (ws) out.push({ t: full });
    else if (other) out.push({ t: full, c: "tk-p" });
  }
  return out;
}

// HTML tokenizer: comments, tags (name/attrs/strings), text.
function tokenizeHtml(code: string): Tok[] {
  const out: Tok[] = [];
  const re = /(<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z][^<>]*\/?>)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushTag = (tag: string) => {
    if (tag.startsWith("<!--")) {
      out.push({ t: tag, c: "tk-c" });
      return;
    }
    const inner = tag.replace(/^<\/?|\/?>$/g, "");
    const im = inner.match(/^[^\s/=]+/);
    out.push({ t: tag.slice(0, tag.startsWith("</") ? 2 : 1), c: "tk-p" });
    if (!im) {
      if (tag.length > 1) out.push({ t: tag.slice(1), c: "tk-p" });
      return;
    }
    out.push({ t: im[0], c: "tk-t" });
    const rest = inner.slice(im[0].length);
    const are =
      /(\s+)|([^\s=/>]+)(=)|("(?:[^"\\]|\\.)*(?:"|$))|('(?:[^'\\]|\\.)*(?:'|$))|(\/?>|.)/g;
    let a: RegExpExecArray | null;
    while ((a = are.exec(rest))) {
      const [f, sp, attr, eq, dqs, sqs] = a;
      if (sp) out.push({ t: f });
      else if (attr) out.push({ t: attr, c: "tk-a" });
      else if (eq) out.push({ t: f, c: "tk-p" });
      else if (dqs || sqs) out.push({ t: f, c: "tk-s" });
      else out.push({ t: f, c: "tk-p" });
    }
    // Re-emit the stripped closing bracket (absent for unclosed tags).
    const end = tag.match(/\/?>$/);
    if (end) out.push({ t: end[0], c: "tk-p" });
  };
  while ((m = re.exec(code))) {
    if (m.index > last) out.push({ t: code.slice(last, m.index) });
    pushTag(m[0]);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push({ t: code.slice(last) });
  return out;
}

export function highlight(code: string, lang: string): Tok[] {
  const f = fam(lang);
  if (f === "html") return tokenizeHtml(code);
  if (f === "css") {
    // CSS: comments, strings, numbers+units, at-rules, properties.
    const re =
      /(\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*(?:"|$))|('(?:[^'\\\n]|\\.)*(?:'|$))|(@[A-Za-z-]+)|((?:^|[{};\n])\s*[A-Za-z-]+(?=\s*:))|(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b)|(\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)|(\s+)|(.)/g;
    const out: Tok[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const [full, com, dqs, sqs, at, prop, hex, num, ws] = m;
      if (com) out.push({ t: full, c: "tk-c" });
      else if (dqs || sqs || hex) out.push({ t: full, c: "tk-s" });
      else if (at) out.push({ t: full, c: "tk-k" });
      else if (prop) {
        const mm = full.match(/^([\s\S]*?)([A-Za-z-]+)$/);
        if (mm) {
          out.push({ t: mm[1] });
          out.push({ t: mm[2], c: "tk-a" });
        } else out.push({ t: full });
      } else if (num) out.push({ t: full, c: "tk-n" });
      else if (ws) out.push({ t: full });
      else out.push({ t: full, c: "tk-p" });
    }
    return out;
  }
  return tokenizeGeneric(code, f === "py" ? KW.py : KW.js);
}

export function isPreviewLang(lang: string): boolean {
  return fam(lang) === "html";
}

// Project title: <title> tag, else first comment/heading line, else lang label.
export function deriveTitle(code: string, label: string): string {
  const m = code.match(/<title[^>]*>([^<]{1,60})<\/title>/i);
  if (m) return m[1].trim();
  const line = code
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0) || "";
  const cm = line.match(/^(?:<!--|--|\/\/|#)\s*(.{1,40}?)\s*(-->)?$/);
  if (cm) return cm[1].trim();
  const tag = line.match(/^<\/?([A-Za-z][^\s>/]*)/);
  if (tag) return `<${tag[1]}…>`;
  return label === "code" ? "Generated code" : `${label} code`;
}

// Split highlighted tokens into per-line rows for line numbers.
export function toLines(toks: Tok[]): Tok[][] {
  const lines: Tok[][] = [[]];
  for (const x of toks) {
    const parts = x.t.split("\n");
    parts.forEach((p, k) => {
      if (k > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ t: p, c: x.c });
    });
  }
  if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop();
  return lines;
}

// Ensure the preview scales on mobile screens.
export function previewDoc(code: string): string {
  if (/<meta[^>]*viewport/i.test(code)) return code;
  if (/<head[^>]*>/i.test(code))
    return code.replace(
      /<head[^>]*>/i,
      (h) => `${h}<meta name="viewport" content="width=device-width, initial-scale=1">`
    );
  return code;
}

const DL_EXT: Record<string, string> = {
  html: "html",
  xml: "html",
  svg: "svg",
  css: "css",
  scss: "css",
  js: "js",
  javascript: "js",
  jsx: "jsx",
  ts: "ts",
  tsx: "tsx",
  py: "py",
  python: "py",
};

export default function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const { t } = useLang();
  const label = lang.trim().toLowerCase() || "code";
  const preview = isPreviewLang(lang);
  // Code first — user switches to preview on demand.
  const [tab, setTab] = useState<"preview" | "code">("code");
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef(0);
  const toks = useMemo(() => highlight(code, label), [code, label]);
  const lines = useMemo(() => toLines(toks), [toks]);
  const title = useMemo(() => deriveTitle(code, label), [code, label]);
  const doc = useMemo(() => previewDoc(code), [code]);

  const flash = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(""), 2200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {}
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
    flash(t("codeCopiedToast"));
  };

  const download = () => {
    try {
      const ext = DL_EXT[label] || "txt";
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9\u0980-\u09FF]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40) || "code";
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      flash(t("codeDownloadedToast"));
    } catch {}
  };

  const toggleFull = () => {
    const next = !full;
    try {
      document.documentElement.style.overflow = next ? "hidden" : "";
    } catch {}
    setFull(next);
  };

  return (
    <div className={`cb${full ? " cb-full" : ""}`}>
      <div className="cb-bar">
        <span className="cb-title" title={title}>
          {title}
        </span>
        <span className="cb-lang">{label}</span>
        <div className="cb-actions">
          {preview && (
            <>
              <button
                className={`cb-icobtn${tab === "code" ? " on" : ""}`}
                onClick={() => setTab("code")}
                title={t("codeCode")}
                aria-label={t("codeCode")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                className={`cb-icobtn${tab === "preview" ? " on" : ""}`}
                onClick={() => setTab("preview")}
                title={t("codePreview")}
                aria-label={t("codePreview")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </>
          )}
          <button className="cb-icobtn" onClick={download} title={t("aiDownloadChat")} aria-label={t("aiDownloadChat")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
          <button className="cb-icobtn" onClick={copy} title={t("copyBtn")} aria-label={t("copyBtn")}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <button className="cb-icobtn" onClick={toggleFull} title={full ? t("collapseBtn") : t("expandBtn")} aria-label={full ? t("collapseBtn") : t("expandBtn")}>
            {full ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M16 21v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {preview && tab === "preview" ? (
        <iframe title={title} className="cb-preview" sandbox="" srcDoc={doc} loading="lazy" />
      ) : (
        <pre className="cb-pre">
          <code>
            {lines.map((ln, li) => (
              <span key={li} className="cb-line">
                <span className="cb-ln" aria-hidden="true">
                  {li + 1}
                </span>
                <span className="cb-lc">
                  {ln.length ? (
                    ln.map((x, k) =>
                      x.c ? (
                        <span key={k} className={x.c}>
                          {x.t}
                        </span>
                      ) : (
                        <span key={k}>{x.t}</span>
                      )
                    )
                  ) : (
                    <span> </span>
                  )}
                </span>
              </span>
            ))}
          </code>
        </pre>
      )}
      {toastMsg ? (
        <div className="cb-toast" role="status">
          {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
