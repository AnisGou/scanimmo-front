import type { Metadata } from "next";
import { DM_Mono, DM_Serif_Display, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getPublicBaseUrl } from "@/lib/app-url";

const baseUrl = getPublicBaseUrl();
const fontDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-display",
});
const fontMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});
const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Scanimmo — Analyse de faisabilit\u00e9 immobili\u00e8re | Qu\u00e9bec",
    template: "%s | Scanimmo",
  },
  description: "Rapport d\u2019analyse fonci\u00e8re en quelques secondes. 12 sources institutionnelles, 3,7 millions de propri\u00e9t\u00e9s au Qu\u00e9bec. Zonage, LiDAR, contamination, inondations, proximit\u00e9.",
  metadataBase: new URL(baseUrl),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: baseUrl,
    siteName: "Scanimmo",
    title: "Scanimmo — Analyse de faisabilit\u00e9 immobili\u00e8re | Qu\u00e9bec",
    description: "Rapport d\u2019analyse fonci\u00e8re en quelques secondes. 12 sources institutionnelles, 3,7 M propri\u00e9t\u00e9s au Qu\u00e9bec.",
  },
  twitter: {
    card: "summary",
    title: "Scanimmo — Analyse immobili\u00e8re Qu\u00e9bec",
    description: "Rapport d\u2019analyse fonci\u00e8re en quelques secondes. 12 sources institutionnelles couvrant 3,7 M propri\u00e9t\u00e9s.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${fontDisplay.variable} ${fontMono.variable} ${fontSans.variable}`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S1K300MKB0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S1K300MKB0');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
