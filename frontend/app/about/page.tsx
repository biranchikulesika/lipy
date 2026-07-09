import { Metadata } from "next";
import { AboutClientContainer } from "@/components/about/AboutClientContainer";

export const metadata: Metadata = {
  title: "About",

  description:
    "Learn about LiPy, an academic project focused on Odia handwritten character recognition, dataset creation, OCR, and machine learning research.",

  openGraph: {
    title: "About LiPy",
    description:
      "Discover the LiPy project, its system architecture, OCR pipeline, dataset, and the technology behind Odia handwritten character recognition.",
    images: [
      {
        url: "/og-about.png",
        width: 1200,
        height: 630,
        alt: "LiPy Project Overview and System Architecture",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "About LiPy",
    description:
      "Discover the LiPy project, its system architecture, OCR pipeline, dataset, and the technology behind Odia handwritten character recognition.",
    images: ["/og-about.png"],
  },
};

export default function AboutPage() {
  return <AboutClientContainer />;
}