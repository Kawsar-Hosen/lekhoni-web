import type { Metadata } from "next";
import GiftClient from "./GiftClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: dict[lang].giftSend,
    description: dict[lang].metaDesc,
    alternates: { canonical: "/gift" },
  };
}

export default function GiftPage() {
  return (
    <div className="narrow">
      <div className="section">
        <GiftClient />
      </div>
    </div>
  );
}
