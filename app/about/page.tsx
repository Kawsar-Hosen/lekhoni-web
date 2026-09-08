import type { Metadata } from "next";
import { dict, type DictKey } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "About",
  description: "About Lekhoni Kahini — Bengali stories reading and writing platform.",
  alternates: { canonical: "/about" },
};

const NOTES: [DictKey, DictKey][] = [
  ["aboutF1T", "aboutF1D"],
  ["aboutF2T", "aboutF2D"],
  ["aboutF3T", "aboutF3D"],
];

export default async function AboutPage() {
  const lang = await getLang();
  const t = dict[lang];
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>{t.aboutTitle}</h1>
        <p className="about-hook">{t.aboutHook}</p>
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
