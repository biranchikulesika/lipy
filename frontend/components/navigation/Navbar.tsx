"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { MAIN_NAVIGATION } from "@/constants/navigation";

export function Navbar() {
	const pathname = usePathname();
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

	// Desktop classes
	const linkBaseClass =
		"relative px-4 py-2 text-[12px] font-semibold tracking-[0.15em] transition-colors duration-200 sm:text-[13px]";
	const internalActiveClass = "text-slate-900 dark:text-slate-100";
	const internalInactiveClass = "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300";
	
	const externalClass =
		"group flex items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-5 py-2 text-[12px] font-semibold tracking-[0.15em] text-slate-500 dark:text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-800 dark:hover:border-white/20 dark:hover:text-slate-300 sm:text-[13px]";

	const internalLinks = MAIN_NAVIGATION.filter(item => !item.isExternal);
	const externalLinks = MAIN_NAVIGATION.filter(item => item.isExternal);

	return (
		<header className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/70">
			<div className="mx-auto flex h-[4.5rem] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link href="/" className="flex flex-col items-start justify-center">
					<span className="font-display text-[16px] font-bold tracking-[0.15em] text-slate-950 dark:text-white sm:text-[18px]">
						LiPi
					</span>
				</Link>

				<nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-2">
					<div className="flex items-center gap-1">
						{internalLinks.map((item) => {
							const isActive = pathname === item.href || (item.id === "ocr" && pathname === "/lipid");
							return (
								<Link
									key={item.id}
									href={item.href}
									className={`${linkBaseClass} ${isActive ? internalActiveClass : internalInactiveClass}`}
								>
									{item.label}
								</Link>
							);
						})}
					</div>

					<div className="ml-6 flex items-center gap-4">
						{externalLinks.map((item) => (
							<a
								key={item.id}
								href={item.href}
								target="_blank"
								rel="noreferrer"
								className={externalClass}
							>
								{item.label}
								<span className="text-[10px] opacity-40 transition group-hover:opacity-100">↗</span>
							</a>
						))}
					</div>
				</nav>

				<div className="flex items-center lg:hidden">
					<button
						aria-label={open ? "Close menu" : "Open menu"}
						aria-expanded={open}
						onClick={() => setOpen(!open)}
						className={`relative z-[80] flex h-10 w-10 items-center justify-center rounded-md transition-colors ${open ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
					>
						<motion.div
							initial={false}
							animate={{ rotate: open ? 90 : 0 }}
							transition={{ duration: 0.2 }}
							className="absolute flex items-center justify-center"
						>
							{open ? (
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden suppressHydrationWarning>
									<path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
								</svg>
							) : (
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden suppressHydrationWarning>
									<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning />
								</svg>
							)}
						</motion.div>
					</button>
				</div>

				<AnimatePresence>
					{open && (
						<div className="fixed inset-0 top-[4.5rem] z-[70] lg:hidden" role="dialog" aria-modal="true">
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.15 }}
								className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm dark:bg-slate-950/60"
								onClick={() => setOpen(false)}
							/>
							<motion.div
								ref={panelRef}
								initial={{ opacity: 0, y: -8, scale: 0.98 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -8, scale: 0.98 }}
								transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
								className="absolute right-4 top-2 w-full max-w-[200px] rounded-[8px] border border-slate-200 bg-white/80 backdrop-blur-xl p-3 shadow-2xl dark:border-white/10 dark:bg-[#0a0a0a]/90 sm:right-6"
							>
								<nav className="flex flex-col gap-1" aria-label="Mobile navigation">
									{internalLinks.map((item) => {
										const isActive = pathname === item.href || (item.id === "ocr" && pathname === "/lipid");
										return (
											<Link
												key={item.id}
												href={item.href}
												className={`flex px-3 py-2 text-[12px] font-semibold tracking-[0.15em] transition-colors rounded-md ${isActive ? 'bg-slate-100/50 text-slate-900 dark:bg-white/5 dark:text-slate-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-white/5'}`}
												onClick={() => setOpen(false)}
											>
												{item.label}
											</Link>
										);
									})}

									<div className="my-1.5 h-px w-full bg-slate-200/60 dark:bg-white/10" />

									{externalLinks.map((item) => {
										return (
											<a
												key={item.id}
												href={item.href}
												target="_blank"
												rel="noreferrer"
												className="flex w-full items-center justify-between rounded-md border border-slate-200/60 dark:border-white/10 px-3 py-2 text-[12px] font-semibold tracking-[0.15em] text-slate-500 dark:text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-100/50 hover:text-slate-900 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-slate-300"
												onClick={() => setOpen(false)}
											>
												{item.label}
												<span className="text-[10px] opacity-40 transition group-hover:opacity-100">↗</span>
											</a>
										);
									})}
								</nav>
							</motion.div>
						</div>
					)}
				</AnimatePresence>
			</div>
		</header>
	);
}

