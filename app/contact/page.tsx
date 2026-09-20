import type { Metadata } from "next";
import SocialIcon, { type SocialName } from "@/components/SocialIcons";
import { dict } from "@/lib/dict";
import { getLang } from "@/lib/lang-server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: "Contact",
    description: dict[lang].metaDesc,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const lang = await getLang();
  const t = dict[lang];
  const socials: { name: SocialName; label: string; href: string }[] = [
    { name: "whatsapp", label: "WhatsApp", href: "https://wa.me/8801926890544" },
    { name: "telegram", label: "Telegram", href: "https://t.me/xyteee" },
  ];
  return (
    <div className="narrow">
      <div className="section">
        <div className="contact-hero">
          <h1>{t.contactTitle}</h1>
          <p>{t.contactHelp}</p>
          <span className="contact-sla">{t.respond48}</span>
        </div>
        <a className="card contact-row" href="mailto:lekhoni-kahini@xyteee.com">
          <span className="contact-ic mail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 6L22 7" />
            </svg>
          </span>
          <span className="contact-tx">
            <strong>Email</strong>
            <span>lekhoni-kahini@xyteee.com</span>
          </span>
          <span className="contact-go">→</span>
        </a>
        {socials.map((s) => (
          <a key={s.name} className="card contact-row" href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
            <span className="contact-ic">
              <SocialIcon name={s.name} size={20} />
            </span>
            <span className="contact-tx">
              <strong>{s.label}</strong>
            </span>
            <span className="contact-go">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
