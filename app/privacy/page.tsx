import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Lekhoni Kahini privacy policy — what data we collect and how we use it.",
  alternates: { canonical: "/privacy" },
};

const POINTS: [string, string][] = [
  ["What we collect", "Account details you give us (name, email), reading activity (history, bookmarks, positions), device identifiers, settings, push tokens (only if enabled), and content you publish (stories, comments)."],
  ["What we never collect", "No contacts, location, call logs, SMS, or files outside the app. No analytics SDKs, no crash reporters, no advertisements."],
  ["How we use it", "To run the app and website, sync your library, personalize your experience, send notifications you asked for, moderate content, and handle support and deletion requests."],
  ["Accounts & security", "Passwords are salted and hashed (PBKDF2, 100,000 iterations) — never plain text. Email codes expire in 10 minutes. Login tokens are encrypted on device. All traffic uses HTTPS."],
  ["Sharing", "We do not sell personal data. Processors only: Cloudflare (hosting/storage), Neon (database), Google (Sign-In, if chosen), Expo (push delivery)."],
  ["Retention", "Verification codes expire in 10 minutes. Accounts and content stay until you delete them; deletions cascade on the server."],
  ["Deletion", "Writers: in-app account delete. Readers: Settings → Delete server data. Or use our deletion request page — requests are processed within 30 days."],
  ["Children", "For ages 15 and older only."],
  ["Contact", "Kawsar Hosen · lekhoni-kahini@xyteee.com · replies within 48 hours."],
];

export default function PrivacyPage() {
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 4px" }}>Privacy Policy</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Last updated: 6 September 2026</p>
        {POINTS.map(([h, p]) => (
          <div key={h} className="card" style={{ padding: "16px 18px", marginTop: 12 }}>
            <h2 style={{ fontSize: 16, margin: "0 0 6px", color: "var(--accent)" }}>{h}</h2>
            <p style={{ margin: 0, fontSize: 14 }}>{p}</p>
          </div>
        ))}
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>
          Official full policy (English + বাংলা):{" "}
          <a href="https://lekhoni-terms.pages.dev/privacy" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700 }}>
            lekhoni-terms.pages.dev/privacy
          </a>
        </p>
      </div>
    </div>
  );
}
