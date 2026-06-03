import { Metadata } from "next";
import { AboutPanel } from "@/components/about/AboutPanel";
import { ClientOnly } from "@/components/ClientOnly";

export const metadata: Metadata = {
    title: "About LiPi",
    description: "Learn about the LiPi project, the architecture of our Odia OCR engine, and how it works.",
};

export default function AboutPage() {
    return (
        <ClientOnly>
            <AboutPanel />
        </ClientOnly>
    );
}
