import { Metadata } from "next";
import { OcrWorkspace } from "@/components/ocr/OcrWorkspace";

export const metadata: Metadata = {
	title: "LiPy | Odia Handwriting Recognition",
	description: "Use our advanced ML models to recognize Odia handwriting from uploaded images or drawings.",
};

export default function Page() {
	return <OcrWorkspace />;
}
