import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Lekhoni Kahini support.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>Contact</h1>
        <div className="card" style={{ padding: 22 }}>
          <p>For support, privacy questions and deletion requests, email us.</p>
          <p>
            <a href="mailto:lekhoni-kahini@xyteee.com" style={{ color: "var(--accent)", fontWeight: 700 }}>
              lekhoni-kahini@xyteee.com
            </a>
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>We respond within 48 hours.</p>
        </div>
      </div>
    </div>
  );
}
