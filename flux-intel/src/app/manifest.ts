import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flux Intelligence",
    short_name: "Flux Intel",
    description: "Real-data website audits powered by PSI, CrUX, and on-page SEO signals.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#f06c5b",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "256x256",
        type: "image/svg+xml",
      },
      {
        src: "/brand/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}
