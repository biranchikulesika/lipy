"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AboutPanel } from "@/components/AboutPanel";
import { Navbar } from "@/components/Navbar";
import { TeamPanel } from "@/components/TeamPanel";

type AppShellProps = {
	children: ReactNode;
};

type ShellView = "ocr" | "lipid" | "about" | "team";

export function AppShell({ children }: AppShellProps) {
	const pathname = usePathname();
	const [activeView, setActiveView] = useState<ShellView>(pathname === "/lipid" ? "lipid" : "ocr");

	useEffect(() => {
		setActiveView(pathname === "/lipid" ? "lipid" : "ocr");
	}, [pathname]);

	return (
		<>
			<Navbar onOpenAbout={() => setActiveView("about")} onOpenTeam={() => setActiveView("team")} />
			{activeView === "about" ? <AboutPanel /> : null}
			{activeView === "team" ? <TeamPanel /> : null}
			{activeView === "ocr" || activeView === "lipid" ? children : null}
		</>
	);
}