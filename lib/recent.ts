// Recently-viewed books (local only).
const KEY = "lk-recent-books";

export function pushRecent(id: string) {
  try {
    const cur = (JSON.parse(window.localStorage.getItem(KEY) || "[]") as string[]).filter((x) => x !== id);
    window.localStorage.setItem(KEY, JSON.stringify([id, ...cur].slice(0, 12)));
  } catch {}
}

export function getRecent(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}
