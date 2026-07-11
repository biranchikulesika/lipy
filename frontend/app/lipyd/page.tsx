import { Metadata } from "next";
import { DatasetContributor } from "@/components/lipyd/DatasetContributor";
import { LipydJsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Dataset",

  description:
    "Contribute handwritten Odia characters to the LiPy dataset and help build an open dataset for OCR and machine learning research.",

  alternates: {
    canonical: "/lipyd",
  },

  openGraph: {
    title: "Contribute to the LiPy Dataset",
    description:
      "Contribute handwritten Odia characters to an open dataset and help train better AI models for Odia OCR and machine learning research.",
    images: [
      {
        url: "/og-dataset.png",
        width: 1200,
        height: 630,
        alt: "LiPyD contributor canvas for drawing and submitting handwritten Odia character samples to the open dataset",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Contribute to the LiPy Dataset",
    description:
      "Contribute handwritten Odia characters to an open dataset and help train better AI models for Odia OCR and machine learning research.",
    images: ["/og-dataset.png"],
  },
};

export default function LiPyDPage() {
  return (
    <>
      <LipydJsonLd />
      <DatasetContributor />
    </>
  );
}