import type { Metadata } from "next";
import WritersFilter from "./WritersFilter";
import { getWriters } from "@/lib/api";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Writers",
  description: "Meet the writers of Lekhoni Kahini — follow your favourite authors.",
  alternates: { canonical: "/writers" },
};

export default async function WritersPage() {
  const lang = await getLang();
  const t = dict[lang];
  const writers = (await getWriters()) || [];
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>{t.writers}</h2>
        </div>
        <WritersFilter writers={writers} />
      </div>
    </div>
  );
}
