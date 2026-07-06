import { Metadata } from "next";
import { AboutClientContainer } from "@/components/about/AboutClientContainer";

export const metadata: Metadata = {
    title: "About LiPy",
    description: "Learn about the LiPy project, the architecture of our Odia Handwriting Recognition system, and how it works.",
    openGraph: {
        title: "About LiPy | System Architecture",
        description: "Learn about the LiPy project, the architecture of our Odia Handwriting Recognition system, and how it works.",
        images: [
            {
                url: "/og-about.png",
                width: 1200,
                height: 630,
                alt: "LiPy System Architecture and Project Overview",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "About LiPy | System Architecture",
        description: "Learn about the LiPy project, the architecture of our Odia Handwriting Recognition system, and how it works.",
        images: ["/og-about.png"],
    },
};

export default function AboutPage() {
    return <AboutClientContainer />;
}
