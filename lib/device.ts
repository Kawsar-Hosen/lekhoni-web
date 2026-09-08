// Stable per-browser device id for guest interactions (likes, comments,
// follows). Stored locally only; doubles as the backend device_key.
const KEY = "lk-device-id";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const h = "0123456789abcdef";
  const s = (n: number) =>
    Array.from({ length: n }, () => h[Math.floor(Math.random() * 16)]).join("");
  return `${s(8)}-${s(4)}-4${s(3)}-${["8", "9", "a", "b"][Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = uuid();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
