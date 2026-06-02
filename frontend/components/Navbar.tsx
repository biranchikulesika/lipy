"use client";

import { useEffect, useRef, useState } from "react";

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
	const [open, setOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};

		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	useEffect(() => {
		// close menu on outside click
		const onDown = (e: MouseEvent) => {
			if (!open) return;
			if (!panelRef.current) return;
			if (e.target instanceof Node && !panelRef.current.contains(e.target)) {
				setOpen(false);
			}
		};

		document.addEventListener("pointerdown", onDown);
		return () => document.removeEventListener("pointerdown", onDown);
	}, [open]);
	const buttonClass =
		"rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition sm:text-xs";

	const activeClass = "border-white/20 bg-white text-slate-950";

	const inactiveClass =
		"border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10";

	const externalClass =
		"group rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:text-xs";

	return (
		<header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/70">
			<div className="mx-auto flex h-[3.75rem] max-w-[1500px] items-center justify-between gap-3 px-3 sm:h-[4rem] sm:px-4 lg:h-[4.25rem] lg:px-6">

				{/* Logo */}

				<button
					type="button"
					onClick={onOpenOcr}
					className="flex flex-col items-start text-left"
				>
					<span className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl lg:text-3xl">
						LiPi
					</span>

					<span className="hidden text-[10px] font-medium tracking-wide text-slate-400 sm:block lg:text-[11px]">
						Odia Handwriting Recognition
					</span>
				</button>

								{/* Navigation (desktop) */}
								<nav
									aria-label="Primary navigation"
									className="hidden lg:flex items-center gap-1.5 overflow-x-auto sm:gap-2"
								>
									<button
										type="button"
										onClick={onOpenOcr}
										className={`${buttonClass} ${
											activeView === "ocr" ? activeClass : inactiveClass
										}`}
									>
										OCR
									</button>

									<button
										type="button"
										onClick={onOpenAbout}
										className={`${buttonClass} ${
											activeView === "about" ? activeClass : inactiveClass
										}`}
									>
										About
									</button>

									<button
										type="button"
										onClick={onOpenTeam}
										className={`${buttonClass} ${
											activeView === "team" ? activeClass : inactiveClass
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

								{/* Mobile hamburger */}
								<div className="flex lg:hidden">
									<button
										aria-label="Open menu"
										aria-expanded={open}
										onClick={() => setOpen(true)}
										className="rounded-md p-2 text-slate-200 hover:bg-white/5"
									>
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
											<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</button>
								</div>

								{/* Mobile panel */}
								{open ? (
									<div className="fixed inset-0 z-[70] flex items-start justify-center lg:hidden" role="dialog" aria-modal="true">
										<div className="absolute inset-0 bg-black/50" />
										<div ref={panelRef} className="relative m-4 w-full max-w-xs rounded-xl bg-slate-950/95 p-4 backdrop-blur-md mobile-scrollable">
											<div className="flex items-center justify-between">
												<div>
													<span className="font-display text-xl font-extrabold tracking-tight text-white">LiPi</span>
												</div>
												<div>
													<button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-200 hover:bg-white/5">
														<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
															<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
														</svg>
													</button>
												</div>
											</div>

											<nav className="mt-4 flex flex-col gap-2" aria-label="Mobile navigation">
												<button
													type="button"
													onClick={() => {
														onOpenOcr();
														setOpen(false);
													}}
													className={`${buttonClass} ${open ? "w-full" : ""} ${activeView === "ocr" ? activeClass : inactiveClass}`}
												>
													OCR
												</button>

												<button
													type="button"
													onClick={() => {
														onOpenAbout();
														setOpen(false);
													}}
													className={`${buttonClass} ${open ? "w-full" : ""} ${activeView === "about" ? activeClass : inactiveClass}`}
												>
													About
												</button>

												<button
													type="button"
													onClick={() => {
														onOpenTeam();
														setOpen(false);
													}}
													className={`${buttonClass} ${open ? "w-full" : ""} ${activeView === "team" ? activeClass : inactiveClass}`}
												>
													Team
												</button>

												<a href="https://lipid-zeta.vercel.app/" target="_blank" rel="noreferrer" className={externalClass} onClick={() => setOpen(false)}>
													<span className="flex items-center gap-1.5">LiPiD <span className="opacity-60">↗</span></span>
												</a>

												<a href="https://github.com/biranchikulesika/lipi" target="_blank" rel="noreferrer" className={externalClass} onClick={() => setOpen(false)}>
													<span className="flex items-center gap-1.5">GitHub <span className="opacity-60">↗</span></span>
												</a>
											</nav>
										</div>
									</div>
								) : null}
			</div>
		</header>
	);
}