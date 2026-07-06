import { Metadata } from "next";
import { DatasetContributor } from "@/components/lipyd/DatasetContributor";

export const metadata: Metadata = {
	title: "LiPy Dataset",
	description: "Contribute handwritten odia characters to the LiPy Dataset.",
	openGraph: {
		title: "LiPy Dataset | Handwriting Collection",
		description: "Contribute handwritten odia characters to the LiPy Dataset.",
		images: [
			{
				url: "/og-dataset.png",
				width: 1200,
				height: 630,
				alt: "LiPyD Dataset Contributor Canvas Preview",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "LiPy Dataset | Handwriting Collection",
		description: "Contribute handwritten odia characters to the LiPy Dataset.",
		images: ["/og-dataset.png"],
	},
};

export default function LiPyDPage() {
	return (
		<DatasetContributor />
	);
}
