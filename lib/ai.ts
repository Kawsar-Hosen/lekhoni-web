// AI client — chat API via same-origin proxy (keys stay server-side).
// Users can switch models; choice persists locally. The server fans out
// across its model registry with fallback, so any model answers well.
import type { DictKey } from "./dict";

export type AiMsg = { role: "user" | "ai"; text: string; image?: string };

export const DEFAULT_MODEL = "gemini-3.5-flash";

// Slow-network cutoff: beyond this the user sees the "slow internet" message.
export const AI_TIMEOUT_MS = 60000;

export type AiErrCode = "offline" | "slow" | "quota" | "overloaded" | "config" | "server" | "unknown";

export class AiError extends Error {
  code: AiErrCode;
  constructor(code: AiErrCode) {
    super(`ai-${code}`);
    this.code = code;
  }
}

// Map an error code to its user-facing dict message.
export function aiErrorKey(code: string): DictKey {
  switch (code) {
    case "offline":
      return "aiErrOffline";
    case "slow":
      return "aiErrSlow";
    case "quota":
      return "aiErrQuota";
    case "overloaded":
      return "aiErrOverloaded";
    default:
      return "aiErrServer";
  }
}

export function getModel(): string {
  try {
    return window.localStorage.getItem("lk-ai-model") || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setModel(m: string) {
  try {
    window.localStorage.setItem("lk-ai-model", m);
  } catch {}
}

export async function listModels(): Promise<string[]> {
  try {
    const r = await fetch("/api/ai/chat", { cache: "no-store" });
    const d = await r.json().catch(() => null);
    return Array.isArray(d?.models) ? d.models : [];
  } catch {
    return [];
  }
}

export async function getSuggestions(messages: AiMsg[]): Promise<string[] | null> {
  try {
    const payload = messages.slice(-6).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text.slice(0, 2000),
    }));
    const r = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // lite model follows the 3-line format best
      body: JSON.stringify({ messages: payload, model: "gemini-3.5-flash-lite", mode: "suggest" }),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(d?.suggestions)) return null;
    return d.suggestions.filter((s: unknown) => typeof s === "string");
  } catch {
    return null;
  }
}
export async function sendAiMessage(messages: AiMsg[]): Promise<string> {
  const payload = messages.slice(-20).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text.slice(0, 6000),
    ...(m.role === "user" && m.image ? { image: m.image } : {}),
  }));
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new AiError("offline");
  }
  const ctl = new AbortController();
  const timer = window.setTimeout(() => ctl.abort(), AI_TIMEOUT_MS);
  let r: Response;
  try {
    r = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: payload, model: getModel() }),
      signal: ctl.signal,
    });
  } catch (e) {
    window.clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") throw new AiError("slow");
    if (typeof navigator !== "undefined" && navigator.onLine === false) throw new AiError("offline");
    throw new AiError("server");
  }
  window.clearTimeout(timer);
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.text) {
    const code = typeof d?.error === "string" ? d.error : "";
    if (code === "quota" || r.status === 429) throw new AiError("quota");
    if (code === "overloaded") throw new AiError("overloaded");
    throw new AiError("server");
  }
  return d.text;
}

