import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.xyteee.com"),
  title: {
    default: "Lekhoni Kahini — Bengali stories, novels & poems",
    template: "%s · Lekhoni Kahini",
  },
  description: "Read Bengali books online — new episodes, timeless novels, and fresh voices.",
  openGraph: {
    siteName: "Lekhoni Kahini",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lekhoni Kahini" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lekhoni Kahini — Bengali stories, novels & poems",
    description: "Read Bengali books online — new episodes, timeless novels, and fresh voices.",
    images: ["/og.png"],
  },
};

// WebSite JSON-LD (sitelinks searchbox eligible).
function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lekhoni Kahini",
    alternateName: "লেখনী কাহিনী",
    url: "https://www.xyteee.com/",
    inLanguage: ["bn", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.xyteee.com/search?q={query}",
      "query-input": "required name=query",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
const themeInit = `(function(){try{var t=localStorage.getItem('lk-theme')||'system';var d=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* Google AdSense ownership verification only — no ad units enabled. */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8665718760035175"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <WebsiteJsonLd />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider initial={lang}>
            <AuthProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
