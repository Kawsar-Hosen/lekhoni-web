import type { Metadata } from "next";
import NewCategoryClient from "./NewCategoryClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "New category",
  description: "Create a website-only category.",
  alternates: { canonical: "/categories/new" },
  robots: { index: false, follow: false },
};

export default async function NewCategoryPage() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="narrow">
      <div className="section">
        <div className="section-head">
          <h2>{t.newCategory}</h2>
        </div>
        <NewCategoryClient />
      </div>
    </div>
  );
}
