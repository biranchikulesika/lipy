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
    template: "%s | LiPy",
    default: "LiPy | Odia Handwriting Recognition Workspace",
  },
  description: "A polished academic OCR and dataset contributor workspace for Odia handwriting recognition. Contribute to the LiPy dataset and use advanced OCR tools.",
  keywords: ["Odia", "Handwriting", "OCR", "LiPyD", "Machine Learning", "Dataset", "AI", "Odia Language"],
  authors: [{ name: "LiPy Team" }],
  creator: "LiPy Team",
  openGraph: {
    title: "LiPy | Odia Handwriting Recognition",
    description: "An open workspace for Odia handwriting recognition OCR and dataset contribution.",
    url: "https://lipy.vercel.app",
    siteName: "LiPy Workspace",
    images: [
      {
        url: "https://ais-pre-mafgx3ewiu2bx2hkktxswe-428062342307.asia-southeast1.run.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "LiPy Odia OCR Workspace Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiPy | Odia Handwriting Recognition",
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
