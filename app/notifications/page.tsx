import type { Metadata } from "next";
import NotifPageClient from "./NotifPageClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: dict[lang].notifTitle,
    description: dict[lang].notifEmptySub,
    alternates: { canonical: "/notifications" },
    robots: { index: false, follow: false },
  };
}

export default function NotificationsPage() {
  return (
    <div className="narrow">
      <NotifPageClient />
    </div>
  );
}
