import type { Metadata } from "next";
import SocialIcon, { type SocialName } from "@/components/SocialIcons";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Lekhoni Kahini support.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const lang = await getLang();
  const t = dict[lang];
  const socials: { name: SocialName; label: string; sub: string; href: string }[] = [
    { name: "whatsapp", label: "WhatsApp", sub: "+880 1926-890544", href: "https://wa.me/8801926890544" },
    { name: "telegram", label: "Telegram", sub: "@xyteee", href: "https://t.me/xyteee" },
  ];
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>{t.contactTitle}</h1>
        <div className="card contact-help">
          <p>{t.contactHelp}</p>
          <p className="contact-mail">
            <a href="mailto:lekhoni-kahini@xyteee.com">
              lekhoni-kahini@xyteee.com
            </a>
            <span>· {t.respond48}</span>
          </p>
        </div>
        <h2 className="contact-sub">{t.contactFollow}</h2>
        <div className="social-row">
          {socials.map((s) => (
            <a key={s.name} className={`social-ic si-${s.name}`} href={s.href} target="_blank" rel="noreferrer" title={s.label} aria-label={`${s.label} — ${s.sub}`}>
              <SocialIcon name={s.name} size={22} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
