"use client";

import { STATS, CHALLENGES, STACK, STATUS, FUTURE_WORK } from "@/constants/about";
import {
	BookOpen,
	Database,
	Scan,
	Layers,
	Code2,
	PenTool,
	Cpu,
	Globe,
	Activity,
	CheckCircle2,
	Zap,
	Server,
	LayoutTemplate,
	BarChart3,
	Target,
	Users2,
	GraduationCap
} from "lucide-react";

export function AboutPanel() {
	return (
		<main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 xl:py-12">
			<div className="space-y-12 md:space-y-20">
				
				{/* 1. HERO SECTION */}
				<section className="relative flex flex-col items-center text-center">
					<div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 dark:opacity-20 pointer-events-none">
						<div className="h-64 w-64 rounded-full bg-blue-500 blur-3xl filter" />
						<div className="h-64 w-64 rounded-full bg-indigo-500 blur-3xl filter -ml-32" />
					</div>
					
					<div className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300 backdrop-blur-sm">
						<GraduationCap className="h-4 w-4" />
						<span className="uppercase tracking-widest">Academic Project</span>
					</div>

					<h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-7xl">
						About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">LiPi</span>
					</h1>

					<p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
						LiPi is an Odia Handwriting Recognition System combining machine learning, human-contributed 
						dataset generation, and language technology research to build an interactive OCR platform.
					</p>
				</section>

				{/* 2. STATS OVERVIEW - Bento style for desktop, cards for mobile */}
				<section>
					{/* Mobile Version (2x2 Grid) - Hidden on desktop */}
					<div className="md:hidden grid grid-cols-2 gap-3">
						{STATS.map((item, i) => {
							const StatIcon = [Layers, Database, Cpu, Globe][i % 4];
							return (
								<div key={item.label} className="flex flex-col gap-3 rounded-[12px] border border-slate-900/10 bg-white/70 backdrop-blur-md p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/60">
									<div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
										<StatIcon className="h-5 w-5" />
									</div>
									<div>
										<p className="text-2xl font-bold text-slate-950 dark:text-white leading-tight">{item.value}</p>
										<p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</p>
									</div>
								</div>
							);
						})}
					</div>

					{/* Desktop Version (Bento grid) - Hidden on mobile */}
					<div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{STATS.map((item, i) => {
							const StatIcon = [Layers, Database, Cpu, Globe][i % 4];
							return (
								<div key={item.label} className="group relative overflow-hidden rounded-[16px] border border-slate-900/10 bg-white/70 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-slate-950/60">
									<div className="absolute right-0 top-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-slate-50 opacity-50 transition-transform group-hover:scale-150 dark:bg-white/5" />
									<div className="relative z-10 flex flex-col gap-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300">
											<StatIcon className="h-6 w-6" />
										</div>
										<div>
											<p className="text-3xl font-extrabold text-slate-950 dark:text-white">{item.value}</p>
											<p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>

				{/* 3. PROJECT BACKGROUND & GOALS - Bento Grid Layout */}
				<section>
					<div className="grid gap-6 md:grid-cols-12 lg:grid-rows-2 lg:h-[500px]">
						{/* Background Panel (Spans 8 cols on desktop) */}
						<div className="relative overflow-hidden rounded-[20px] border border-slate-900/10 bg-white/70 backdrop-blur-md p-6 md:col-span-12 lg:col-span-7 lg:row-span-1 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-8">
							<div className="absolute -right-10 -top-10 text-slate-100 dark:text-white/[0.03]">
								<BookOpen className="h-48 w-48" strokeWidth={1} />
							</div>
							
							<div className="relative z-10">
								<h2 className="flex items-center gap-3 text-2xl font-bold text-slate-950 dark:text-white">
									<Target className="h-6 w-6 text-indigo-500" />
									Project Background
								</h2>
								<p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
									Handwritten character recognition remains a challenging problem due to differences in
									writing styles, stroke variations, and the availability of language-specific datasets.
								</p>
								<p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
									While OCR technologies are widely available for major languages, resources for
									handwritten Odia script remain limited. LiPi explores practical machine learning solutions while 
									contributing toward language technology research.
								</p>
							</div>
						</div>

						{/* Academic Context (Spans 5 cols on desktop) */}
						<div className="flex flex-col justify-center rounded-[20px] border border-slate-900/10 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 md:col-span-12 lg:col-span-5 lg:row-span-2 shadow-sm dark:border-white/10 dark:from-indigo-950/20 dark:to-blue-950/20 sm:p-8">
							<div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 sm:flex-col sm:items-start text-left">
								<div className="flex shrink-0 h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[12px] bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300">
									<Users2 className="h-6 w-6 sm:h-7 sm:w-7" />
								</div>
								<h2 className="text-xl sm:text-2xl font-bold text-slate-950 dark:text-white leading-tight">
									Academic Context
								</h2>
							</div>
							<p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
								Developed under the <strong>NIELIT Bhubaneswar Internship Programme</strong> with guidance from Bijaylaxmi Behera.
							</p>
							<div className="mt-5 sm:mt-6 h-px w-full bg-slate-900/10 dark:bg-white/10" />
							<p className="mt-5 sm:mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
								Carried out by second-year students of the 5-Year Integrated MCA programme at 
								<strong> Utkal University, Bhubaneswar</strong>.
							</p>
						</div>

						{/* Goals Panel (Spans 7 cols on desktop) */}
						<div className="rounded-[20px] border border-slate-900/10 bg-white/70 backdrop-blur-md p-6 md:col-span-12 lg:col-span-7 lg:row-span-1 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-8">
							<h2 className="text-xl font-bold text-slate-950 dark:text-white mb-5">Primary Goals</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
								{[
									"Build Odia character dataset",
									"ML model for classification",
									"Real-time OCR interface",
									"Dataset contributor platform",
									"Regional language computing",
									"Future tech research"
								].map((goal, i) => (
									<div key={i} className="flex items-start gap-2.5">
										<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
										<span className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-snug">{goal}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* 4. THE CHALLENGES - Mobile Swipe Cards vs Desktop Grid */}
				<section className="space-y-6 md:space-y-8">
					<h2 className="text-2xl font-semibold text-center text-slate-950 dark:text-white md:text-3xl">
						The Challenge
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
						{CHALLENGES.map((item, i) => {
							const Icon = [PenTool, Database, Scan][i % 3];
							return (
								<div key={item.title} className="relative overflow-hidden rounded-[16px] border border-slate-900/10 bg-slate-50/70 p-5 sm:p-8 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40">
									<div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-6 sm:flex-col sm:items-start text-left">
										<div className="shrink-0 inline-flex rounded-[10px] bg-slate-200/50 p-2.5 sm:p-3 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
											<Icon className="h-5 w-5 sm:h-6 sm:w-6" />
										</div>
										<h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white leading-tight">
											{item.title}
										</h3>
									</div>
									<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mt-2 sm:mt-0">
										{item.description}
									</p>
								</div>
							);
						})}
					</div>
				</section>

				{/* 5. LIPI ECOSYSTEM VISUALIZATION */}
				<section className="rounded-[24px] border border-slate-900/10 bg-slate-900 p-6 dark:border-white/10 dark:bg-slate-950 sm:p-10 relative overflow-hidden">
					<div className="relative z-10 flex flex-col items-center">
						<h2 className="text-2xl font-semibold text-white md:text-3xl">The LiPi Ecosystem</h2>
						<p className="mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-400 sm:text-base">
							A unified workflow from crowdsourced dataset collection through preprocessing and model training, ending in real-time inference.
						</p>

						{/* Mobile Workflow (Vertical) */}
						<div className="mt-10 flex w-full flex-col gap-3 md:hidden">
							{[
								{ title: "LiPiD Collection", icon: Users2 },
								{ title: "Preparation", icon: Database },
								{ title: "Image Processing", icon: Layers },
								{ title: "CNN Training", icon: Cpu },
								{ title: "OCR Recognition", icon: Scan },
								{ title: "Prediction Results", icon: BarChart3 }
							].map((step, i) => (
								<div key={step.title} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
										<step.icon className="h-5 w-5" />
									</div>
									<div className="text-sm font-semibold text-white">{step.title}</div>
								</div>
							))}
						</div>

						{/* Desktop Workflow (Horizontal Flow) */}
						<div className="mt-16 hidden w-full items-center justify-between gap-2 md:flex lg:px-10">
							{[
								{ title: "Collection", icon: Users2 },
								{ title: "Preparation", icon: Database },
								{ title: "Processing", icon: Layers },
								{ title: "CNN Training", icon: Cpu },
								{ title: "Recognition", icon: Scan },
								{ title: "Results", icon: BarChart3 }
							].map((step, i) => (
								<div key={step.title} className="relative flex flex-col items-center group">
									<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-md transition-transform group-hover:scale-110">
										<step.icon className="h-7 w-7" />
									</div>
									<div className="text-center text-xs font-medium tracking-wide text-white uppercase">{step.title}</div>
									
									{/* Connectors */}
									{i < 5 && (
										<div className="absolute left-1/2 top-8 -z-10 ml-8 h-[2px] w-[calc(100%+2rem)] bg-gradient-to-r from-white/20 to-white/5" />
									)}
								</div>
							))}
						</div>
					</div>
					
					{/* Abstract Background Design */}
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
				</section>
				
				{/* 6. TECH STACK & STATUS ROW */}
				<section className="grid gap-6 md:grid-cols-2">
					{/* Tech Stack */}
					<div className="rounded-[20px] border border-slate-900/10 bg-white/70 backdrop-blur-md p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-8">
						<h2 className="flex items-center gap-3 text-xl font-bold text-slate-950 dark:text-white mb-6">
							<Code2 className="h-6 w-6 text-indigo-500" />
							Tech Stack
						</h2>
						<div className="grid gap-4">
							{STACK.map((item, i) => {
								const TechIcon = [LayoutTemplate, Server, Cpu, Globe][i % 4];
								return (
									<div key={item.title} className="flex items-center gap-4 rounded-xl border border-slate-900/10 bg-slate-50/70 backdrop-blur-sm p-4 dark:border-white/10 dark:bg-white/[0.04]">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-[#050505] dark:border dark:border-white/10 text-slate-600 dark:text-slate-400">
											<TechIcon className="h-5 w-5" />
										</div>
										<div>
											<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.title}</p>
											<p className="text-sm font-bold text-slate-950 dark:text-white">{item.value}</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					
					{/* Status & Future Work */}
					<div className="flex flex-col gap-6">
						<div className="rounded-[20px] border border-slate-900/10 bg-white/70 backdrop-blur-md p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-8 h-full">
							<h2 className="flex items-center gap-3 text-xl font-bold text-slate-950 dark:text-white mb-6">
								<Activity className="h-6 w-6 text-blue-500" />
								Status Overview
							</h2>
							<div className="grid grid-cols-2 gap-4">
								{STATUS.map((item) => (
									<div key={item.title} className="rounded-xl border border-slate-900/5 p-4 dark:border-white/5">
										<p className="text-xs font-medium text-slate-500">{item.title}</p>
										<div className="mt-2 flex items-center gap-1.5">
											<div className={`h-2 w-2 rounded-full ${item.value === "Active" ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
											<p className="text-sm font-bold text-slate-950 dark:text-white">{item.value}</p>
										</div>
									</div>
								))}
							</div>
							
							<div className="mt-8 pt-6 border-t border-slate-900/5 dark:border-white/5">
								<h3 className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white mb-4">
									<Zap className="h-4 w-4 text-amber-500" /> Future Scope
								</h3>
								<div className="flex flex-wrap gap-2 sm:gap-2.5">
									{FUTURE_WORK.map((item) => (
										<div key={item} className="flex-grow sm:flex-grow-0 flex items-center justify-center rounded-[8px] border border-slate-900/5 bg-slate-50 px-3 py-2 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
											<span className="text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300">
												{item}
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</section>
				
			</div>
		</main>
	);
}
