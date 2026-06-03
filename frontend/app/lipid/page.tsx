import { Metadata } from "next";
import { DatasetContributor } from "@/components/lipid/DatasetContributor";

export const metadata: Metadata = {
	title: "LiPi-D Dataset",
	description: "Contribute traces and handwritten characters to the LiPi-D open-source dataset for Odia character recognition.",
};

export default function LiPiDPage() {
	return (
		<DatasetContributor />
	);
}
