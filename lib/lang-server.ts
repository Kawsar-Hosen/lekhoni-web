import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./dict";

// Server-side UI language. Cookie is set ONLY by explicit toggle;
// absent cookie (including bots) always means English default.
export async function getLang(): Promise<Lang> {
  try {
    const c = (await cookies()).get(LANG_COOKIE)?.value;
    if (c === "bn" || c === "en") return c;
  } catch {}
  return "bn";
}
