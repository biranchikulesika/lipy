"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AboutPanel = dynamic(() => import("./AboutPanel").then(mod => mod.AboutPanel), {
  ssr: false,
  loading: () => <div className="min-h-[calc(100dvh-4.5rem)] w-full" />,
});

const MobileStoryCarousel = dynamic(() => import("./MobileStoryCarousel").then(mod => mod.MobileStoryCarousel), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[100] w-full h-[100dvh] bg-black" />,
});

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
