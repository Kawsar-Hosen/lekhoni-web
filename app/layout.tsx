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
  metadataBase: new URL("https://lekhoni-web.pages.dev"),
  title: {
    default: "Lekhoni Kahini — Bengali stories, novels & poems",
    template: "%s · Lekhoni Kahini",
  },
  description: "Read Bengali books online — new episodes, timeless novels, and fresh voices.",
  openGraph: {
    siteName: "Lekhoni Kahini",
    type: "website",
    locale: "en_US",
  },
};

// Runs before paint: applies saved/system theme without flash.
const themeInit = `(function(){try{var t=localStorage.getItem('lk-theme')||'system';var d=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
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
