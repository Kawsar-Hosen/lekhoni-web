import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Tiro_Bangla, Hind_Siliguri, Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import Chrome from "@/components/Chrome";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "লেখনী কাহিনী",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

const tiroBangla = Tiro_Bangla({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["bengali", "latin"],
  variable: "--font-bn-serif",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-bn-sans",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-en-sans",
  display: "swap",
});

const fraunces = Fraunces({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-en-serif",
  display: "swap",
});
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
const themeInit = `(function(){try{var t=localStorage.getItem('lk-theme')||'light';var d=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning className={`${tiroBangla.variable} ${hindSiliguri.variable} ${inter.variable} ${fraunces.variable}`}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* Google AdSense ownership verification only — no ad units enabled. */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8665718760035175"
          crossOrigin="anonymous"
          suppressHydrationWarning
        />
        <WebsiteJsonLd />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider initial={lang}>
            <AuthProvider>
              <Chrome>{children}</Chrome>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
