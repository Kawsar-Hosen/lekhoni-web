import type { Metadata } from "next";
import WriteForm from "./WriteForm";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Write a Story",
  description: "Write and publish a new story on Lekhoni Kahini.",
  alternates: { canonical: "/write" },
  robots: { index: false, follow: false },
};

export default async function WritePage() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="narrow">
      <div className="section">
        <div className="section-head">
          <h2>{t.writeStory}</h2>
        </div>
        <WriteForm />
      </div>
    </div>
  );
}
