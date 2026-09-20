"use client";

import type { CSSProperties, ReactNode } from "react";

function wrap(
  ta: HTMLTextAreaElement | null,
  before: string,
  after: string,
  set: (v: string) => void,
  current: string
) {
  if (!ta) return;
  const s = ta.selectionStart ?? current.length;
  const e = ta.selectionEnd ?? current.length;
  const sel = current.slice(s, e) || "text";
  const next = current.slice(0, s) + before + sel + after + current.slice(e);
  set(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(s + before.length, s + before.length + sel.length);
  });
}

function linePrefix(
  ta: HTMLTextAreaElement | null,
  prefix: string,
  set: (v: string) => void,
  current: string
) {
  if (!ta) return;
  const s = ta.selectionStart ?? 0;
  const start = current.lastIndexOf("\n", s - 1) + 1;
  const next = current.slice(0, start) + prefix + current.slice(start);
  set(next);
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(s + prefix.length, s + prefix.length);
  });
}

export default function EditorToolbar({
  value,
  onChange,
  el,
}: {
  value: string;
  onChange: (v: string) => void;
  el: HTMLTextAreaElement | null;
}) {
  const btns: { label: ReactNode; title: string; fn: () => void; style?: CSSProperties }[] = [
    { label: <b>B</b>, title: "Bold", fn: () => wrap(el, "**", "**", onChange, value) },
    { label: <i>I</i>, title: "Italic", fn: () => wrap(el, "*", "*", onChange, value) },
    { label: <mark>H</mark>, title: "Highlight", fn: () => wrap(el, "==", "==", onChange, value) },
    { label: <s>S</s>, title: "Strikethrough", fn: () => wrap(el, "~~", "~~", onChange, value) },
    { label: <code>{"<>"}</code>, title: "Code", fn: () => wrap(el, "`", "`", onChange, value) },
    { label: "H2", title: "Heading", fn: () => linePrefix(el, "## ", onChange, value) },
    { label: "•", title: "List", fn: () => linePrefix(el, "- ", onChange, value) },
    { label: "❝", title: "Quote", fn: () => linePrefix(el, "> ", onChange, value) },
    { label: "―", title: "Divider", fn: () => linePrefix(el, "---", onChange, value) },
  ];
  return (
    <div className="ed-tools">
      {btns.map((b) => (
        <button key={b.title} type="button" title={b.title} onClick={b.fn} style={b.style}>
          {b.label}
        </button>
      ))}
    </div>
  );
}
