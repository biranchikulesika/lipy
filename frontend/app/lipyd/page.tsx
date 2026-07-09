import { Metadata } from "next";
import { DatasetContributor } from "@/components/lipyd/DatasetContributor";

export const metadata: Metadata = {
  title: "Dataset",

  description:
    "Contribute handwritten Odia characters to the LiPy dataset and help build an open, high-quality dataset for OCR and machine learning research.",

  alternates: {
    canonical: "/lipyd",
  },

  openGraph: {
    title: "Contribute to the LiPy Dataset",
    description:
      "Help improve Odia handwriting recognition by contributing handwritten character samples to the open LiPy dataset.",
    images: [
      {
        url: "/og-dataset.png",
        width: 1200,
        height: 630,
        alt: "LiPy Dataset Contributor Workspace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Contribute to the LiPy Dataset",
    description:
      "Help improve Odia handwriting recognition by contributing handwritten character samples to the open LiPy dataset.",
    images: ["/og-dataset.png"],
  },
};

export default function LiPyDPage() {
  return <DatasetContributor />;
}