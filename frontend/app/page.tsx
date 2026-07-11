import { Metadata } from "next";
import { OcrWorkspace } from "@/components/ocr/OcrWorkspace";
import { HomeJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Odia Handwriting Recognition",

  description:
    "Draw or upload a handwritten Odia character and LiPy's deep learning OCR identifies it right away — free, no signup needed.",

  openGraph: {
    title: "Odia Handwriting Recognition",
    description:
      "Draw or upload a handwritten Odia character and LiPy's deep learning OCR identifies it right away — free, no signup needed.",
    images: [
      {
        url: "/og-ocr.png",
        width: 1200,
        height: 630,
        alt: "LiPy Odia handwriting recognition web interface showing a character being analyzed by the deep learning OCR model",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Odia Handwriting Recognition",
    description:
      "Draw or upload a handwritten Odia character and LiPy's AI identifies it right away — a free OCR tool for everyone, no signup required.",
    images: ["/og-ocr.png"],
  },

  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return (
    <>
      <HomeJsonLd />
      <OcrWorkspace />
    </>
  );
}