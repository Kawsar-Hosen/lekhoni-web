import type { MetadataRoute } from "next";

// Web App Manifest — foundation for future app conversion (TWA / wrapper).
// Icons are SVG ("any" + maskable purpose) so no raster pipeline is needed yet;
// add 192/512px PNGs before Play-Store (TWA) submission.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "লেখনী কাহিনী — Lekhoni Kahini",
    short_name: "লেখনী কাহিনী",
    description: "Read Bengali books online — new episodes, timeless novels, and fresh voices.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#fafaf9",
    lang: "bn",
    dir: "ltr",
    categories: ["books", "education", "entertainment"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
