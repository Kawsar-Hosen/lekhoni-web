import type { Metadata } from "next";
import AffiliateClient from "./AffiliateClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: dict[lang].affiliate,
    description: dict[lang].metaDesc,
    alternates: { canonical: "/affiliate" },
  };
}

export default function AffiliatePage() {
  return (
    <div className="narrow">
      <div className="section">
        <AffiliateClient />
      </div>
    </div>
  );
}
