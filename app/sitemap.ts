import type { MetadataRoute } from "next";
import { getBooks, getWriters } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://xyteee.com";
  const [books, writers] = await Promise.all([getBooks(), getWriters()]);
  const staticRoutes = ["", "/books", "/writers", "/categories", "/search", "/about", "/contact", "/privacy", "/delete-request"].map(
    (r) => ({ url: `${base}${r || "/"}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: r === "" ? 1 : 0.7 })
  );
  const bookRoutes = (books || []).map((b) => ({
    url: `${base}/book/${b.id}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const writerRoutes = (writers || []).map((w) => ({
    url: `${base}/writer/${w.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...bookRoutes, ...writerRoutes];
}
