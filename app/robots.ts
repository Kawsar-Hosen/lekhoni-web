import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://lekhoni-web.pages.dev/sitemap.xml",
    host: "https://lekhoni-web.pages.dev",
  };
}
