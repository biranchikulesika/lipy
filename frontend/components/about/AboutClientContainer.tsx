"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AboutPanel = dynamic(() => import("./AboutPanel").then(mod => mod.AboutPanel), {
  ssr: false,
  loading: () => <div className="min-h-[calc(100dvh-4.5rem)] w-full" />,
});

const MobileStoryCarousel = dynamic(() => import("./MobileStoryCarousel").then(mod => mod.MobileStoryCarousel), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-100 w-full h-dvh bg-black flex flex-col items-center justify-center p-6">
      {/* Progress skeleton */}
      <div className="absolute top-0 left-0 w-full z-50 pt-4 px-2 flex gap-1.5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-0 h-full bg-white/30 rounded-full" />
          </div>
        ))}
      </div>
      {/* Content skeleton with gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-zinc-950 via-black to-verdigris-950/20" />
      <div className="z-10 flex flex-col items-center text-center px-6 gap-6 w-full max-w-lg animate-pulse">
        <div className="h-10 w-48 bg-white/10 rounded-lg" />
        <div className="space-y-3 w-full">
          <div className="h-5 bg-white/8 rounded-md" />
          <div className="h-5 w-4/5 mx-auto bg-white/8 rounded-md" />
          <div className="h-5 w-3/5 mx-auto bg-white/8 rounded-md" />
        </div>
      </div>
    </div>
  ),
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

  // During SSR / before hydration, show a gradient skeleton instead of blank/null
  if (isMobile === null) {
    return (
      <div className="fixed inset-0 z-100 w-full h-dvh bg-black flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-linear-to-br from-zinc-950 via-black to-verdigris-950/20" />
        <div className="z-10 flex flex-col items-center text-center px-6 gap-6 w-full max-w-lg animate-pulse">
          <div className="h-10 w-48 bg-white/10 rounded-lg" />
          <div className="space-y-3 w-full">
            <div className="h-5 bg-white/8 rounded-md" />
            <div className="h-5 w-4/5 mx-auto bg-white/8 rounded-md" />
            <div className="h-5 w-3/5 mx-auto bg-white/8 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return isMobile ? <MobileStoryCarousel /> : <AboutPanel />;
}
