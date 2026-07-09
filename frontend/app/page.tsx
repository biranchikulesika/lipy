import { Metadata } from "next";
import { OcrWorkspace } from "@/components/ocr/OcrWorkspace";

export const metadata: Metadata = {
  title: "Odia Handwriting Recognition",

  description:
    "Recognize handwritten Odia characters using LiPy's deep learning OCR. Draw, upload, or capture an image to get instant predictions.",

  openGraph: {
    title: "Odia Handwriting Recognition",
    description:
      "Recognize handwritten Odia characters using LiPy's deep learning OCR. Draw, upload, or capture an image to get instant predictions.",
    images: [
      {
        url: "/og-ocr.png",
        width: 1200,
        height: 630,
        alt: "LiPy Odia Handwriting Recognition Workspace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Odia Handwriting Recognition",
    description:
      "Recognize handwritten Odia characters using LiPy's deep learning OCR. Draw, upload, or capture an image to get instant predictions.",
    images: ["/og-ocr.png"],
  },

  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return <OcrWorkspace />;
}