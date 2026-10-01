import type { IconName } from "./Icon";
import type { WriterNotif } from "@/lib/api";

export const notifIcon = (t: string): IconName => {
  const s = (t || "").toLowerCase();
  if (s.includes("like") || s.includes("love") || s.includes("follow")) return "heart";
  if (
    s.includes("stor") ||
    s.includes("book") ||
    s.includes("epis") ||
    s.includes("chapter") ||
    s.includes("approv") ||
    s.includes("publish")
  )
    return "book";
  return "bell";
};

export function notifTimeAgo(iso: string, lang: string): string {
  try {
    const ms = new Date(iso).getTime() - Date.now();
    const rtf = new Intl.RelativeTimeFormat(lang === "bn" ? "bn" : "en", { numeric: "auto" });
    const a = Math.abs(ms);
    const min = 60_000;
    const hr = 3_600_000;
    const day = 86_400_000;
    if (a < min) return rtf.format(Math.round(ms / 1000), "second");
    if (a < hr) return rtf.format(Math.round(ms / min), "minute");
    if (a < day) return rtf.format(Math.round(ms / hr), "hour");
    return rtf.format(Math.round(ms / day), "day");
  } catch {
    return "";
  }
}

export function notifLink(n: WriterNotif): string {
  if (n.url) return n.url;
  if (n.story_id) return `/book/${n.story_id}`;
  return "";
}
