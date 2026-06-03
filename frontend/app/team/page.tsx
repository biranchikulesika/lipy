import { Metadata } from "next";
import { TeamPanel } from "@/components/team/TeamPanel";
import { TEAM_MEMBERS } from "@/constants/team";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
	title: "Our Team",
	description: "Meet the researchers, engineers, and contributors behind the LiPi Odia OCR project.",
};

export default function TeamPage() {
	// Check which profile photos exist in the public directory
	const validPhotos = TEAM_MEMBERS.map(member => member.photoFilename)
		.filter((filename): filename is string => {
			if (!filename) return false;
			try {
				const filePath = path.join(process.cwd(), "public", "team", filename);
				return fs.existsSync(filePath);
			} catch (e) {
				return false;
			}
		});

	return <TeamPanel validPhotos={validPhotos} />;
}
