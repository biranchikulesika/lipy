import { Metadata } from "next";
import { AboutPanel } from "@/components/about/AboutPanel";
import { ClientOnly } from "@/components/ClientOnly";

export const metadata: Metadata = {
    title: "About LiPy",
    description: "Learn about the LiPy project, the architecture of our Odia OCR engine, and how it works.",
};

export default function AboutPage() {
    return (
        <ClientOnly>
            <AboutPanel />
        </ClientOnly>
    );
}
