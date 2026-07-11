"use client";

import { useEffect, useState } from "react";
import { AboutPanel } from "./AboutPanel";
import { MobileStoryCarousel } from "./MobileStoryCarousel";

export function AboutClientContainer() {
	const [isMobile, setIsMobile] = useState<boolean | null>(null);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// During SSR / before hydration, render nothing (prevents mismatch).
	// On first client render, immediately decide mobile vs desktop — no placeholder gap.
	if (isMobile === null) return null;

	return isMobile ? <MobileStoryCarousel /> : <AboutPanel />;
}
