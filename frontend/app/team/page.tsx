import { Metadata } from "next";
import { TeamPanel } from "@/components/team/TeamPanel";
import { TEAM_MEMBERS } from "@/constants/team";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
	title: "Our Team",
	description: "Meet the people behind the LiPy Odia Handwriting Recognition system.",
	openGraph: {
		title: "Our Team | LiPy Project Developers",
		description: "Meet the people behind the LiPy Odia Handwriting Recognition system.",
		images: [
			{
				url: "/og-team.png",
				width: 1200,
				height: 630,
				alt: "LiPy Odia Handwriting Recognition Team Members",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Our Team | LiPy Project Developers",
		description: "Meet the people behind the LiPy Odia Handwriting Recognition system.",
		images: ["/og-team.png"],
	},
};

export const dynamic = "force-dynamic";

export default function TeamPage() {
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

	// Guys this is for randomising the order of team members on each page load. This is to ensure that no one feels left out or less important than others. The order of team members is randomized on each page load, so everyone gets a fair chance to be seen :)
	const shuffledMembers = [...TEAM_MEMBERS];
	for (let i = shuffledMembers.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledMembers[i], shuffledMembers[j]] = [shuffledMembers[j], shuffledMembers[i]];
	}

	return <TeamPanel validPhotos={validPhotos} members={shuffledMembers} />;
}
