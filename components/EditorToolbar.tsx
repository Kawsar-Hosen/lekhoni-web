"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";

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
  textAreaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const btns: { label: ReactNode; title: string; fn: () => void; style?: CSSProperties }[] = [
    { label: <b>B</b>, title: "Bold", fn: () => wrap(textAreaRef.current, "**", "**", onChange, value) },
    { label: <i>I</i>, title: "Italic", fn: () => wrap(textAreaRef.current, "*", "*", onChange, value) },
    { label: <mark>H</mark>, title: "Highlight", fn: () => wrap(textAreaRef.current, "==", "==", onChange, value) },
    { label: "H2", title: "Heading", fn: () => linePrefix(textAreaRef.current, "## ", onChange, value) },
    { label: "•", title: "List", fn: () => linePrefix(textAreaRef.current, "- ", onChange, value) },
    { label: "❝", title: "Quote", fn: () => linePrefix(textAreaRef.current, "> ", onChange, value) },
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
