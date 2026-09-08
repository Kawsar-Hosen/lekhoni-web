import type { Metadata } from "next";
import { dict, type DictKey } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Lekhoni Kahini privacy policy — what data we collect and how we use it.",
  alternates: { canonical: "/privacy" },
};

const POINTS: [DictKey, DictKey][] = [
  ["ppT1", "pp1"],
  ["ppT2", "pp2"],
  ["ppT3", "pp3"],
  ["ppT4", "pp4"],
  ["ppT5", "pp5"],
  ["ppT6", "pp6"],
];

export default async function PrivacyPage() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 4px" }}>{t.privacy}</h1>
        <p className="pp-updated">{t.ppUpdated}</p>
        <div className="pp-list">
        {POINTS.map(([h, p], i) => (
          <div key={h} className="card pp-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="pp-num">{i + 1}</span>
            <div>
              <h2><span className={`pp-hl pp-h${(i % 6) + 1}`}>{t[h]}</span></h2>
              <p>{t[p]}</p>
            </div>
          </div>
        ))}
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>
          {t.ppOfficial}:{" "}
          <a href="https://lekhoni-terms.pages.dev/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700 }}>
            lekhoni-terms.pages.dev/privacy
          </a>
        </p>
      </div>
    </div>
  );
}
