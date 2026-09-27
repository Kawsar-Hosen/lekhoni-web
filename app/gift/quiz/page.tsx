import type { Metadata } from "next";
import QuizClient from "./QuizClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: dict[lang].quizTitle,
    description: dict[lang].metaDesc,
    alternates: { canonical: "/gift/quiz" },
  };
}

export default function QuizPage() {
  return (
    <div className="narrow">
      <div className="section">
        <QuizClient />
      </div>
    </div>
  );
}
