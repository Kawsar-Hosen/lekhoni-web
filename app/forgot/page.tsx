import type { Metadata } from "next";
import ForgotClient from "./ForgotClient";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: dict[lang].resetPwTitle,
    description: dict[lang].metaDesc,
    alternates: { canonical: "/forgot" },
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPage() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="wrap">
      <div className="section">
        <div className="card auth-shell">
          <div className="auth-brand">
            <span className="brand-mark">ল</span>
            <h2>Lekhoni Kahini</h2>
            <p>{t.loginTag}</p>
          </div>
          <div className="auth-form">
            <ForgotClient />
          </div>
        </div>
      </div>
    </div>
  );
}
