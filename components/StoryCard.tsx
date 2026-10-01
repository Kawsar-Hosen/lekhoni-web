"use client";

import { useState } from "react";
import { renderAiMd } from "@/components/RichText";

export function isStoryReply(text: string): boolean {
  const t = text.trim();
  if (/^#{1,2}\s+\S/m.test(t)) return true;
  if (/^##\s*(অধ্যায়|অধ্যায়|Chapter|Part)/im.test(t)) return true;
  return false;
}

function stripMd(s: string): string {
  return s
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|\W)\*([^*\n]+?)\*/g, "$1$2")
    .replace(/==(.+?)==/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`([^`\n]+?)`/g, "$1")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[(book|writer):[A-Za-z0-9-]{8,}\]/gi, "")
    .trim();
}

function splitStory(text: string): { title: string; body: string; sources: { label: string; url: string }[] } {
  const lines = text.trim().split("\n");
  let title = "";
  let start = 0;
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const m = lines[i].trim().match(/^#{1,2}\s+(.*)/);
    if (m) {
      title = m[1].trim();
      start = i + 1;
      break;
    }
  }
  let rest = lines.slice(start).join("\n");
  const sources: { label: string; url: string }[] = [];
  const sm = rest.match(/\n(Sources|সূত্র|উৎস)[:：]?\s*\n([\s\S]*)$/i);
  if (sm) {
    rest = rest.slice(0, sm.index).trim();
    const items = sm[2].split("\n").map((l) => l.trim()).filter(Boolean);
    for (const it of items) {
      const um = it.match(/(https?:\/\/[^\s)]+)/);
      if (um) {
        const label = it.replace(um[1], "").replace(/^[-*•\d.)\s]+/, "").trim() || um[1];
        sources.push({ label, url: um[1] });
      }
    }
  }
  if (!title) {
    const first = rest.split("\n").find((l) => l.trim());
    title = first ? stripMd(first).slice(0, 80) : "";
  }
  return { title, body: rest.trim(), sources };
}

export default function StoryCard({
  text,
  onRegenerate,
  onSpeak,
}: {
  text: string;
  onRegenerate: () => void;
  onSpeak: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const { title, body, sources } = splitStory(text);
  const plain = `${stripMd(title)}\n\n${stripMd(body)}`.trim();

  const copy = async () => {
    try {
      await window.navigator.clipboard.writeText(plain);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = plain;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    try {
      if (window.navigator.share) {
        await window.navigator.share({ title, text: plain });
        return;
      }
    } catch {}
    copy();
  };

  return (
    <div className="story-card">
      <div className="story-card-bar">
        <span className="story-card-kicker">📖 গল্প</span>
        <span className="story-card-acts">
          <button onClick={copy} aria-label="Copy story" title="Copy">
            {copied ? (
              "✓"
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <button onClick={onRegenerate} aria-label="Regenerate" title="Regenerate">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button onClick={() => onSpeak(plain)} aria-label="Read aloud" title="Read aloud">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5L6 9H2v6h4l5 4z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9.4 9.4 0 0 1 0 13" />
            </svg>
          </button>
          <button onClick={share} aria-label="Share" title="Share">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4" />
            </svg>
          </button>
        </span>
      </div>
      {title && <h3 className="story-card-title">{title}</h3>}
      <div
        className="ai-md story-card-body"
        dangerouslySetInnerHTML={{ __html: renderAiMd(body) }}
      />
      {sources.length > 0 && (
        <div className="story-sources">
          <div className="story-sources-h">Sources</div>
          <ul>
            {sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
