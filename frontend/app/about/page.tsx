import { Metadata } from "next";
import { AboutClientContainer } from "@/components/about/AboutClientContainer";
import { AboutJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "About",

  description:
    "Learn about LiPy, an academic project focused on Odia handwritten character recognition, dataset creation, OCR, and machine learning research.",

  alternates: {
    canonical: "/about",
  },

  openGraph: {
    title: "About LiPy",
    description:
      "Explore how LiPy uses deep learning to recognize handwritten Odia characters — from crowdsourced dataset collection to EfficientNetB0 training to deployment.",
    images: [
      {
        url: "/og-about.png",
        width: 1200,
        height: 630,
        alt: "LiPy system architecture diagram showing dataset collection, EfficientNetB0 model training, inference pipeline, and cloud deployment",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "About LiPy",
    description:
      "Explore how LiPy uses deep learning to recognize handwritten Odia characters — from crowdsourced dataset collection to EfficientNetB0 training to deployment.",
    images: ["/og-about.png"],
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutJsonLd />
      <AboutClientContainer />
    </>
  );
}