"use client";

import { useEffect, useState } from "react";
import { AboutPanel } from "./AboutPanel";
import { MobileStoryCarousel } from "./MobileStoryCarousel";
import { ClientOnly } from "@/components/ClientOnly";

export function AboutClientContainer() {
	const [isMobile, setIsMobile] = useState<boolean | null>(null);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768); // 768px corresponds to the tailwind 'md' breakpoint
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<ClientOnly>
			{isMobile === null ? (
				// Render a transparent loader/placeholder to prevent mismatch or sudden shift
				<div className="w-full h-[calc(100dvh-4.5rem)] flex items-center justify-center bg-transparent" />
			) : isMobile ? (
				<MobileStoryCarousel />
			) : (
				<AboutPanel />
			)}
		</ClientOnly>
	);
}
