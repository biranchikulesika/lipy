import { Metadata } from "next";
import { AboutClientContainer } from "@/components/about/AboutClientContainer";

export const metadata: Metadata = {
    title: "About LiPy",
    description: "Learn about the LiPy project, the architecture of our Odia Handwriting Recognition system, and how it works.",
};

export default function AboutPage() {
    return <AboutClientContainer />;
}
