import type { Metadata } from "next";
import { dict, type DictKey } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "About",
    description: dict[lang].metaDesc,
    alternates: { canonical: "/about" },
  };
}

const NOTES: [DictKey, DictKey][] = [
  ["aboutF1T", "aboutF1D"],
  ["aboutF2T", "aboutF2D"],
  ["aboutF3T", "aboutF3D"],
];

const STEPS: [DictKey, DictKey][] = [
  ["aboutS1T", "aboutS1D"],
  ["aboutS2T", "aboutS2D"],
  ["aboutS3T", "aboutS3D"],
  ["aboutS4T", "aboutS4D"],
];

export default async function AboutPage() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>{t.aboutTitle}</h1>
        <p className="about-hook">{t.aboutHook}</p>
        <h2 className="about-sec">{t.howItWorks}</h2>
        <ol className="about-steps">
          {STEPS.map(([h, p], i) => (
            <li key={h} className="about-step" style={{ animationDelay: `${i * 0.1}s` }}>
              <span className="about-snum">{i + 1}</span>
              <div>
                <h3>{t[h]}</h3>
                <p>{t[p]}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="about-notes">
          {NOTES.map(([h, p], i) => (
            <div key={h} className="about-note">
              <span className="about-num">{i + 1}</span>
              <div>
                <h2>{t[h]}</h2>
                <p>{t[p]}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="about-closing">{t.aboutClosing}</p>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>© 2026 Lekhoni Kahini · Kawsar Hosen · v1.1.0</p>
      </div>
    </div>
  );
}
