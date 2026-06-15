import { Metadata } from "next";
import { DatasetContributor } from "@/components/LiPyD/DatasetContributor";

export const metadata: Metadata = {
	title: "LiPy Dataset",
	description: "Contribute traces and handwritten characters to the LiPyD open-source dataset for Odia character recognition.",
};

export default function LiPyDPage() {
	return (
		<DatasetContributor />
	);
}
