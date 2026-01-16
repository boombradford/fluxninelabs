import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://engine.fluxninelabs.com/",
      lastModified: new Date(),
    },
  ];
}
