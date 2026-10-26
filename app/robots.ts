import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://xyteee.com/sitemap.xml",
    host: "https://xyteee.com",
  };
}
