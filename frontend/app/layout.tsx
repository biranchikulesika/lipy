import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { Navbar } from "@/components/navigation/Navbar";
import { RootJsonLd } from "@/components/JsonLd";
import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

export const viewport: Viewport = {
  themeColor: "#0b1917",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: {
    default: "LiPy",
    template: "%s | LiPy",
  },

  applicationName: "LiPy",

  description:
    "LiPy is an academic project for Odia handwritten character recognition, OCR, dataset creation, and machine learning research.",

  keywords: [
    "LiPy",
    "Odia",
    "Odia OCR",
    "Odia Handwriting",
    "Odia Character Recognition",
    "Odia Handwritten Character Recognition",
    "Odia Handwritten Character Dataset",
    "OCR",
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Dataset",
    "AI",
    "Utkal University",
    "NIELIT Bhubaneswar",
  ],

  authors: [{ name: "LiPy Team" }],
  creator: "LiPy Team",
  category: "technology",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "LiPy",
    description:
      "LiPy is an open-source platform that uses deep learning to recognize handwritten Odia characters, build a crowdsourced dataset, and advance OCR research.",
    url: "/",
    siteName: "LiPy",
    images: [
      {
        url: "/og-ocr.png",
        width: 1200,
        height: 630,
        alt: "LiPy Odia handwriting recognition web interface showing a character being analyzed by the deep learning OCR model",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "LiPy",
    description:
      "LiPy is an open-source platform that uses deep learning to recognize handwritten Odia characters, build a crowdsourced dataset, and advance OCR research.",
    images: ["/og-ocr.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-sans antialiased`}
      >
        <RootJsonLd />
        <Navbar />
        {children}
      </body>
    </html>
  );
}