import { Metadata } from "next";
import { AboutPanel } from "@/components/about/AboutPanel";
import { MobileStoryCarousel } from "@/components/about/MobileStoryCarousel";
import { ClientOnly } from "@/components/ClientOnly";

export const metadata: Metadata = {
    title: "About LiPy",
    description: "Learn about the LiPy project, the architecture of our Odia Handwriting Recognition system, and how it works.",
};

export default function AboutPage() {
    return (
        <ClientOnly>
            <div className="hidden md:block">
                <AboutPanel />
            </div>
            <div className="block md:hidden">
                <MobileStoryCarousel />
            </div>
        </ClientOnly>
    );
}
