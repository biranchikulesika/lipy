import { Metadata } from "next";
import { TeamPanel } from "@/components/team/TeamPanel";
import { TEAM_MEMBERS } from "@/constants/team";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
	title: "Our Team",
	description: "Meet the researchers, engineers, and contributors behind the LiPi Odia OCR project.",
};

export const dynamic = "force-dynamic";

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

	// Implement Fisher-Yates shuffle for true randomness
	const shuffledMembers = [...TEAM_MEMBERS];
	for (let i = shuffledMembers.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledMembers[i], shuffledMembers[j]] = [shuffledMembers[j], shuffledMembers[i]];
	}

	return <TeamPanel validPhotos={validPhotos} members={shuffledMembers} />;
}