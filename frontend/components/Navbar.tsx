"use client";

type NavbarProps = {
	activeView: "ocr" | "about" | "team";
	onOpenAbout: () => void;
	onOpenTeam: () => void;
	onOpenOcr: () => void;
};

export function Navbar({
	activeView,
	onOpenAbout,
	onOpenTeam,
	onOpenOcr,
}: NavbarProps) {
	const buttonClass =
		"rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition sm:text-xs";

	const activeClass =
		"border-white/20 bg-white text-slate-950";

	const inactiveClass =
		"border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10";

	const externalClass =
		"group rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:text-xs";

	return (
		<header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/70">
			<div className="mx-auto flex h-[4.75rem] max-w-[1500px] items-center justify-between gap-4 px-3 sm:px-4 lg:px-6">

				{/* Logo */}

				<button
					type="button"
					onClick={onOpenOcr}
					className="flex flex-col items-start text-left"
				>
					<span className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
						LiPi
					</span>

					<span className="hidden text-[11px] font-medium tracking-wide text-slate-400 sm:block">
						Odia Handwriting Recognition
					</span>
				</button>

				{/* Navigation */}

				<nav
					aria-label="Primary navigation"
					className="flex items-center gap-1.5 overflow-x-auto sm:gap-2"
				>
					<button
						type="button"
						onClick={onOpenOcr}
						className={`${buttonClass} ${activeView === "ocr"
								? activeClass
								: inactiveClass
							}`}
					>
						OCR
					</button>

					<button
						type="button"
						onClick={onOpenAbout}
						className={`${buttonClass} ${activeView === "about"
								? activeClass
								: inactiveClass
							}`}
					>
						About
					</button>

					<button
						type="button"
						onClick={onOpenTeam}
						className={`${buttonClass} ${activeView === "team"
								? activeClass
								: inactiveClass
							}`}
					>
						Team
					</button>

					<a
						href="https://lipid-zeta.vercel.app/"
						target="_blank"
						rel="noreferrer"
						className={externalClass}
					>
						<span className="flex items-center gap-1.5">
							LiPiD
							<span className="opacity-60 transition group-hover:opacity-100">
								↗
							</span>
						</span>
					</a>

					<a
						href="https://github.com/biranchikulesika/lipi"
						target="_blank"
						rel="noreferrer"
						className={externalClass}
					>
						<span className="flex items-center gap-1.5">
							GitHub
							<span className="opacity-60 transition group-hover:opacity-100">
								↗
							</span>
						</span>
					</a>
				</nav>
			</div>
		</header>
	);
}