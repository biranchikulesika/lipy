"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavbarProps = {
	onOpenAbout: () => void;
	onOpenTeam: () => void;
};

const ROUTES = [
	{ href: "/", label: "OCR" },
	{ href: "/lipid", label: "LiPiD" },
] as const;

export function Navbar({ onOpenAbout, onOpenTeam }: NavbarProps) {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/70">
			<div className="mx-auto flex h-[4.25rem] max-w-[1500px] items-center justify-between gap-4 px-3 sm:px-4 lg:px-5">
				<Link href="/" className="flex items-center gap-3 text-white" aria-label="LiPi home">
					<span className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">LiPi</span>
				</Link>

				<nav aria-label="Primary navigation" className="flex items-center gap-1.5 overflow-x-auto sm:gap-2">
					{ROUTES.map((item) => {
						const isActive = pathname === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={isActive ? "page" : undefined}
								className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition sm:text-xs ${isActive ? "border-white/20 bg-white text-slate-950" : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"}`}
							>
								{item.label}
							</Link>
						);
					})}

					<button
						type="button"
						onClick={onOpenAbout}
						className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/20 hover:bg-white/10 sm:text-xs"
					>
						About
					</button>

					<button
						type="button"
						onClick={onOpenTeam}
						className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/20 hover:bg-white/10 sm:text-xs"
					>
						Team
					</button>

					<a
						href="https://github.com"
						target="_blank"
						rel="noreferrer"
						className="rounded-full border border-white/10 bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-slate-100 sm:text-xs"
					>
						GitHub
					</a>
				</nav>
			</div>
		</header>
	);
}