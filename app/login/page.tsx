import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import Icon from "@/components/Icon";
import { dict, type DictKey } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Lekhoni Kahini writer account.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

const POINTS: DictKey[] = ["loginP1", "loginP2", "loginP3"];

export default async function LoginPage() {
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
            <h2>{t.signIn}</h2>
            <p className="sub">{t.loginSub}</p>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
