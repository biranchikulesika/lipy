import { Metadata } from "next";
import { TeamPanel } from "@/components/team/TeamPanel";
import { TeamJsonLd } from "@/components/JsonLd";
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
      "Meet the five-member student team from Utkal University building LiPy, an open academic project for Odia handwritten character recognition and OCR.",
    images: [
      {
        url: "/og-team.png",
        width: 1200,
        height: 630,
        alt: "Five student team members from Utkal University behind the LiPy Odia handwritten character recognition project",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Meet the LiPy Team",
    description:
      "Meet the five-member student team from Utkal University building LiPy, an open academic project for Odia handwritten character recognition and OCR.",
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
    <>
      <TeamJsonLd />
      <TeamPanel
        validPhotos={validPhotos}
        members={shuffledMembers}
      />
    </>
  );
}