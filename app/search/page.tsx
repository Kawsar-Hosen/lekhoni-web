import type { Metadata } from "next";
import SearchClient from "./SearchClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Bengali books, writers and categories.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="wrap">
      <div className="section">
        <div className="section-head">
          <h2>{t.search}</h2>
        </div>
        <SearchClient initialQ={sp.q || ""} />
      </div>
    </div>
  );
}
