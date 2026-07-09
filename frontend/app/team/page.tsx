import { Metadata } from "next";
import { TeamPanel } from "@/components/team/TeamPanel";
import { TEAM_MEMBERS } from "@/constants/team";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Team",

  description:
    "Meet the team behind LiPy, an academic project focused on Odia handwritten character recognition, OCR, and dataset development.",

  alternates: {
    canonical: "/team",
  },

  openGraph: {
    title: "Meet the LiPy Team",
    description:
      "Meet the students building LiPy, an open academic project for Odia handwritten character recognition.",
    images: [
      {
        url: "/og-team.png",
        width: 1200,
        height: 630,
        alt: "The LiPy Project Team",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Meet the LiPy Team",
    description:
      "Meet the students and contributors building LiPy, an open academic project for Odia handwritten character recognition.",
    images: ["/og-team.png"],
  },
};

export const dynamic = "force-dynamic";

export default function TeamPage() {
  const validPhotos = TEAM_MEMBERS.map((member) => member.photoFilename).filter(
    (filename): filename is string => {
      if (!filename) return false;

      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          "team",
          filename
        );

        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    }
  );

  // Randomize the order on every request so no team member
  // consistently appears first. Everyone gets equal visibility.
  const shuffledMembers = [...TEAM_MEMBERS];

  for (let i = shuffledMembers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledMembers[i], shuffledMembers[j]] = [
      shuffledMembers[j],
      shuffledMembers[i],
    ];
  }

  return (
    <TeamPanel
      validPhotos={validPhotos}
      members={shuffledMembers}
    />
  );
}