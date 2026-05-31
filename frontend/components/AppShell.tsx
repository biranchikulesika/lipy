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

	const [activeView, setActiveView] = useState<ShellView>(
		pathname === "/lipid" ? "lipid" : "ocr"
	);

	useEffect(() => {
		if (pathname === "/lipid") {
			setActiveView("lipid");
		} else {
			setActiveView("ocr");
		}

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	}, [pathname]);

	const handleOpenOcr = () => {
		setActiveView("ocr");

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const handleOpenAbout = () => {
		setActiveView("about");

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const handleOpenTeam = () => {
		setActiveView("team");

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<>
			<Navbar
				activeView={
					activeView === "about"
						? "about"
						: activeView === "team"
							? "team"
							: "ocr"
				}
				onOpenOcr={handleOpenOcr}
				onOpenAbout={handleOpenAbout}
				onOpenTeam={handleOpenTeam}
			/>

			{activeView === "about" && <AboutPanel />}

			{activeView === "team" && <TeamPanel />}

			{(activeView === "ocr" || activeView === "lipid") && children}
		</>
	);
}