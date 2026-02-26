import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

export const metadata: Metadata = {
    title: "Flux Intelligence | Real-Data Website Audits",
    description: "Real-data website audits powered by PSI, CrUX, and on-page SEO signals. Clear recommendations without guesswork.",
    keywords: ["St. Louis SEO", "Local SEO St. Louis", "Digital Marketing St. Louis", "Website Audit", "AI SEO Tool", "Flux Nine Labs"],
    metadataBase: new URL("https://engine.fluxninelabs.com"),
    alternates: {
        canonical: "/",
    },
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/brand/logo.jpg",
    },
    openGraph: {
        title: "Flux Intelligence | Real-Data Website Audits",
        description: "Run a real-data website audit with PSI, CrUX, and on-page SEO signals.",
        url: "https://engine.fluxninelabs.com",
        siteName: "Flux Nine Labs",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Flux Intelligence | Real-Data Website Audits",
        description: "Real-data website audits with PSI, CrUX, and on-page SEO signals.",
        creator: "@fluxninelabs",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
            <body className="antialiased font-sans bg-[#030712] min-h-screen" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
