import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
    title: "Flux Intelligence | St. Louis Local SEO & Digital Strategy",
    description: "The premier AI-driven SEO and digital intelligence engine for St. Louis businesses. Optimize your local search presence with forensic precision.",
    keywords: ["St. Louis SEO", "Local SEO St. Louis", "Digital Marketing St. Louis", "Website Audit", "AI SEO Tool", "Flux Nine Labs"],
    openGraph: {
        title: "Flux Intelligence | St. Louis Local SEO",
        description: "Dominate the St. Louis market with military-grade digital intelligence. Run a free forensic audit now.",
        url: "https://fluxninelabs.com",
        siteName: "Flux Nine Labs",
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Flux Intelligence | St. Louis SEO",
        description: "Forensic digital auditing for the modern strategist.",
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
        <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
            <body className="antialiased font-sans" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
