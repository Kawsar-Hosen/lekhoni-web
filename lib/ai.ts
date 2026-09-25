// AI client — CodeCraft API via same-origin proxy (key stays server-side).
// Users can switch models; choice persists locally.
export type AiMsg = { role: "user" | "ai"; text: string; image?: string };

export const DEFAULT_MODEL = "gemini-3.5-flash";

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
export async function sendAiMessage(
  messages: AiMsg[],
  _context: { bookId?: string; bookTitle?: string; chapter?: number }
): Promise<string> {
  const payload = messages.slice(-20).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text.slice(0, 6000),
    ...(m.role === "user" && m.image ? { image: m.image } : {}),
  }));
  const r = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: payload, model: getModel() }),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.text) throw new Error("ai-failed");
  return d.text;
}
