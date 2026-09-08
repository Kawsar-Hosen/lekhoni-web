import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Lekhoni Kahini — Bengali stories reading and writing platform.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="narrow">
      <div className="section">
        <h1 style={{ fontSize: 28, margin: "0 0 12px" }}>About Lekhoni Kahini</h1>
        <div className="card" style={{ padding: 22 }}>
          <p>
            Lekhoni Kahini is a Bengali stories reading and writing platform. Read novels, poems and
            fresh episodes online, download books for offline reading, and publish your own writing
            with Writer Studio.
          </p>
          <p style={{ color: "var(--muted)" }}>
            This website shows the same live catalogue as the Lekhoni Kahini Android app. Reader
            accounts, writing and publishing happen inside the app.
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>© 2026 Lekhoni Kahini · Kawsar Hosen · v1.1.0</p>
        </div>
      </div>
    </div>
  );
}
