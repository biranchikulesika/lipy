import { Metadata } from "next";
import { OcrWorkspace } from "@/components/ocr/OcrWorkspace";

export const metadata: Metadata = {
	title: "LiPy | Odia Handwriting Recognition",
	description: "Use our advanced ML models to recognize Odia handwriting from uploaded images or drawings.",
	openGraph: {
		title: "LiPy | Odia Handwriting Recognition",
		description: "Use our advanced ML models to recognize Odia handwriting from uploaded images or drawings.",
		images: [
			{
				url: "/og-ocr.png",
				width: 1200,
				height: 630,
				alt: "LiPy Odia Handwriting OCR Workspace Preview",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "LiPy | Odia Handwriting Recognition",
		description: "Use our advanced ML models to recognize Odia handwriting from uploaded images or drawings.",
		images: ["/og-ocr.png"],
	},
};

export default function Page() {
	return <OcrWorkspace />;
}
