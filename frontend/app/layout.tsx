import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/navigation/Navbar";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | LiPi",
    default: "LiPi | Odia Handwriting Recognition Workspace",
  },
  description: "A polished academic OCR and dataset contributor workspace for Odia handwriting recognition. Contribute to the LiPi dataset and use advanced OCR tools.",
  keywords: ["Odia", "Handwriting", "OCR", "Lipid", "Machine Learning", "Dataset", "AI", "Odia Language"],
  authors: [{ name: "LiPi Team" }],
  creator: "LiPi Team",
  openGraph: {
    title: "LiPi | Odia Handwriting Recognition",
    description: "An open workspace for Odia handwriting recognition OCR and dataset contribution.",
    url: "https://lipi.app",
    siteName: "LiPi Workspace",
    images: [
      {
        url: "https://ais-pre-mafgx3ewiu2bx2hkktxswe-428062342307.asia-southeast1.run.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "LiPi Odia OCR Workspace Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiPi | Odia Handwriting Recognition",
    description: "An open workspace for Odia handwriting recognition OCR and dataset contribution.",
    images: ["https://ais-pre-mafgx3ewiu2bx2hkktxswe-428062342307.asia-southeast1.run.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-sans antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
