import { Metadata } from "next";
import { DatasetContributor } from "@/components/lipyd/DatasetContributor";

export const metadata: Metadata = {
	title: "LiPy Dataset",
	description: "Contribute handwritten odia characters to the LiPy Dataset.",
};

export default function LiPyDPage() {
	return (
		<DatasetContributor />
	);
}
