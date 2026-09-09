import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";
import Icon from "@/components/Icon";
import { dict, type DictKey } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Lekhoni Kahini writer account.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};

const POINTS: DictKey[] = ["regP1", "regP2", "regP3"];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="wrap">
      <div className="section">
        <div className="card auth-shell">
          <div className="auth-brand">
            <span className="brand-mark">ল</span>
            <h2>Lekhoni Kahini</h2>
            <p>{t.regTag}</p>
            <ul>
              {POINTS.map((p) => (
                <li key={p}>
                  <Icon name="chevR" size={14} />
                  {t[p]}
                </li>
              ))}
            </ul>
          </div>
          <div className="auth-form">
            <h2>{t.signUp}</h2>
            <p className="sub">{t.regSub}</p>
            <RegisterForm verifyEmail={sp.verify || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
