import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Drift | Flux Nine Labs",
  description: "Monitor week-over-week changes in PSI, CrUX, on-page SEO, and CTAs. Real-data drift tracking with actionable deltas.",
  metadataBase: new URL("https://drift.fluxninelabs.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Project Drift | Flux Nine Labs",
    description: "Real-data drift tracking for performance, SEO, and CTA changes.",
    url: "https://drift.fluxninelabs.com",
    siteName: "Flux Nine Labs",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Drift | Flux Nine Labs",
    description: "Real-data drift tracking for PSI, CrUX, and on-page changes.",
  },
};

export default function DriftLayout({ children }: { children: React.ReactNode }) {
  return children;
}
