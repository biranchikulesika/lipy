"use client";

import { STATS, CHALLENGES, STACK, FUTURE_WORK } from "@/constants/about";
import {
	Database,
	Scan,
	Layers,
	PenTool,
	Cpu,
	Globe,
	CheckCircle2,
	Zap,
	Server,
	LayoutTemplate,
	Target,
	Users2,
	GraduationCap,
	ChevronDown,
	Sparkles
} from "lucide-react";

export function AboutPanel() {
	return (
		<main className="w-full h-[calc(100dvh-4.5rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth bg-white dark:bg-[#030712] selection:bg-verdigris-500/30">
			
			{/* SLIDE 1: HERO */}
			<section className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex flex-col items-center justify-center relative px-6 text-center overflow-hidden">
				{/* Premium Animated Background */}
				<div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
					<div className="absolute top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-verdigris-400/20 dark:bg-verdigris-600/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />
					<div className="absolute bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-[3000ms]" />
					<div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:opacity-10 opacity-30" />
				</div>
				
				<div className="inline-flex items-center gap-2 rounded-full border border-verdigris-500/30 bg-white/50 px-4 py-2 text-xs sm:text-sm font-semibold text-verdigris-700 dark:border-verdigris-400/20 dark:bg-black/30 dark:text-verdigris-300 backdrop-blur-xl mb-12 shadow-lg shadow-verdigris-500/10 transition-transform hover:scale-105">
					<GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
					<span className="uppercase tracking-[0.2em]">Academic Research Project</span>
				</div>
				
				<h1 className="font-display text-6xl font-extrabold tracking-tighter text-slate-900 dark:text-white sm:text-8xl lg:text-9xl relative">
					Meet <span className="text-transparent bg-clip-text bg-gradient-to-br from-verdigris-500 via-teal-400 to-blue-600 drop-shadow-sm">LiPy</span>
					<Sparkles className="absolute -top-6 -right-12 h-10 w-10 text-verdigris-400 animate-bounce" />
				</h1>
				
				<p className="mt-10 max-w-3xl text-lg sm:text-2xl leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
					An Odia Handwritten Character Recognition System uniting deep learning and crowdsourced data into a beautifully modern platform.
				</p>

				{/* Scroll Indicator */}
				<div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
					<span className="text-xs font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">Discover</span>
					<ChevronDown className="h-5 w-5 text-slate-400" />
				</div>
			</section>

			{/* SLIDE 2: BACKGROUND & ACADEMIC CONTEXT */}
			<section className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex flex-col justify-center px-6 py-24 relative overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]">
				{/* Watermark */}
				<Target className="absolute -right-32 top-1/2 -translate-y-1/2 h-[600px] w-[600px] text-slate-200 dark:text-white/[0.02] -z-10 rotate-12" />

				<div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
					<div className="space-y-10">
						<div className="inline-flex items-center gap-4">
							<div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
								<Target className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
							</div>
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">Project Context</h2>
						</div>
						<p className="text-lg sm:text-xl leading-loose text-slate-600 dark:text-slate-400">
							Handwritten character recognition remains a complex barrier due to infinite stroke variations. While AI technologies dominate major languages, handwritten Odia script research is highly restricted. <span className="font-semibold text-verdigris-600 dark:text-verdigris-400">LiPy bridges this gap.</span>
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
							{["Build Odia character dataset", "CNN model classification", "Real-time OCR interface", "Future tech research"].map((goal, i) => (
								<div key={i} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none">
									<CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-verdigris-500 transition-transform group-hover:scale-110" />
									<span className="text-base font-semibold text-slate-700 dark:text-slate-300">{goal}</span>
								</div>
							))}
						</div>
					</div>
					
					<div className="relative p-10 sm:p-14 rounded-[40px] bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden group">
						<div className="absolute top-0 right-0 w-64 h-64 bg-verdigris-400/10 dark:bg-verdigris-500/10 blur-[80px] rounded-full transition-transform group-hover:scale-150" />
						
						<div className="relative z-10 space-y-10">
							<div className="inline-flex items-center gap-4">
								<div className="p-3 bg-verdigris-100 dark:bg-verdigris-900/30 rounded-2xl">
									<Users2 className="h-8 w-8 text-verdigris-600 dark:text-verdigris-400" />
								</div>
								<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Academic Roots</h2>
							</div>
							
							<div className="space-y-8">
								<div className="flex flex-col gap-2">
									<span className="text-sm font-bold tracking-widest uppercase text-slate-400">Mentorship</span>
									<p className="text-xl sm:text-2xl font-medium leading-relaxed text-slate-800 dark:text-slate-200">
										Developed under the <span className="text-indigo-600 dark:text-indigo-400">NIELIT Bhubaneswar</span> Internship Programme with guidance from Bijaylaxmi Behera.
									</p>
								</div>
								
								<div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-300 to-transparent dark:from-white/10 dark:via-white/5" />
								
								<div className="flex flex-col gap-2">
									<span className="text-sm font-bold tracking-widest uppercase text-slate-400">Execution</span>
									<p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300">
										Implemented by second-year students of the 5-Year Integrated MCA programme at <span className="font-semibold text-slate-900 dark:text-white">Utkal University, Bhubaneswar</span>.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* SLIDE 3: THE ECOSYSTEM WORKFLOW */}
			<section className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden bg-slate-950 text-white">
				{/* Dark Glassmorphic Background */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-verdigris-900/20 via-[#030712] to-[#030712]" />
				
				<div className="max-w-[1400px] mx-auto w-full text-center relative z-10">
					<h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6">The Ecosystem</h2>
					<p className="text-xl sm:text-2xl text-slate-400 max-w-4xl mx-auto mb-24 font-light">
						A completely unified architecture moving seamlessly from crowdsourced dataset generation into real-time browser inference.
					</p>
					
					<div className="flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-4 relative w-full px-4">
						{/* Glowing Connecting Line (Desktop) */}
						<div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-verdigris-500 to-transparent opacity-30" />
						<div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-verdigris-400 to-transparent blur-sm opacity-50 animate-pulse" />
						
						{[
							{ title: "Collection", desc: "Browser Canvas", icon: Users2 },
							{ title: "Preparation", desc: "Data Formatting", icon: Database },
							{ title: "Processing", desc: "OpenCV Core", icon: Layers },
							{ title: "Training", desc: "Keras CNN", icon: Cpu },
							{ title: "Inference", desc: "FastAPI Runtime", icon: Server },
							{ title: "OCR Results", desc: "React UI", icon: Scan }
						].map((step, i) => (
							<div key={step.title} className="flex flex-col items-center group w-full lg:w-auto relative cursor-default">
								{/* Glassmorphic Orb */}
								<div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-500 group-hover:bg-verdigris-500/20 group-hover:border-verdigris-400/50 group-hover:-translate-y-4 mb-6 z-10">
									<step.icon className="h-10 w-10 text-slate-300 transition-colors duration-500 group-hover:text-white" />
									{/* Hover glow */}
									<div className="absolute inset-0 bg-verdigris-400/20 blur-xl rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 -z-10" />
								</div>
								
								<div className="text-2xl font-bold tracking-tight text-white mb-2 transition-transform duration-500 group-hover:-translate-y-2">{step.title}</div>
								<div className="text-sm font-semibold tracking-wide uppercase text-slate-500 transition-transform duration-500 group-hover:-translate-y-2">{step.desc}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* SLIDE 4: CHALLENGES */}
			<section className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex flex-col justify-center px-6 py-24 bg-white dark:bg-[#050505]">
				<div className="max-w-[1400px] mx-auto w-full">
					<h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-20 md:mb-32 text-center md:text-left">The Obstacles</h2>
					
					<div className="grid md:grid-cols-3 gap-16 md:gap-12 lg:gap-20">
						{CHALLENGES.map((item, i) => {
							const Icon = [PenTool, Database, Scan][i % 3];
							return (
								<div key={item.title} className="relative group flex flex-col">
									{/* Massive Faint Number Background */}
									<div className="absolute -top-16 -left-8 text-[150px] font-black text-slate-100 dark:text-white/[0.02] -z-10 transition-transform duration-700 group-hover:-translate-y-4 group-hover:-translate-x-4">
										0{i + 1}
									</div>
									
									<div className="mb-8 p-4 inline-flex rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 transition-colors duration-500 group-hover:bg-verdigris-50 dark:group-hover:bg-verdigris-900/30">
										<Icon className="h-8 w-8 text-slate-400 transition-colors duration-500 group-hover:text-verdigris-500 dark:group-hover:text-verdigris-400" />
									</div>
									
									<h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
										{item.title}
									</h3>
									
									<p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
										{item.description}
									</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* SLIDE 5: TECH STACK & BY THE NUMBERS */}
			<section className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex flex-col justify-center px-6 py-24 relative overflow-hidden bg-slate-50 dark:bg-black">
				<div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-2 gap-24 lg:gap-16 items-center">
					
					{/* By the numbers (Typography focused) */}
					<div className="space-y-16">
						<div>
							<h2 className="text-sm font-bold tracking-[0.2em] uppercase text-verdigris-600 dark:text-verdigris-400 mb-4">Project Scale</h2>
							<h3 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">By The Numbers</h3>
						</div>
						
						<div className="grid grid-cols-2 gap-x-12 gap-y-16">
							{STATS.map((item) => (
								<div key={item.label} className="group flex flex-col border-l-4 border-slate-200 dark:border-white/10 pl-6 transition-colors duration-500 hover:border-verdigris-400">
									<p className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter transition-transform duration-500 group-hover:-translate-y-2">
										{item.value}
									</p>
									<p className="text-sm font-bold text-slate-500 tracking-wider uppercase">
										{item.label}
									</p>
								</div>
							))}
						</div>
					</div>

					{/* Tech Stack (Glassmorphic Pills) */}
					<div className="relative">
						<div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-verdigris-500/10 dark:from-indigo-900/20 dark:to-verdigris-900/20 rounded-[3rem] blur-3xl -z-10" />
						
						<div className="p-10 sm:p-16 rounded-[3rem] bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
							<h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Core Technology</h2>
							
							<div className="flex flex-col gap-6">
								{STACK.map((item, i) => {
									const TechIcon = [LayoutTemplate, Server, Cpu, Globe][i % 4];
									return (
										<div key={item.title} className="group flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-3xl bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-slate-300 dark:hover:border-white/20">
											<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 transition-colors group-hover:bg-verdigris-50 group-hover:text-verdigris-600 dark:group-hover:bg-verdigris-900/30 dark:group-hover:text-verdigris-400">
												<TechIcon className="h-7 w-7" />
											</div>
											<div>
												<p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.title}</p>
												<p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>

				</div>
			</section>

			{/* SLIDE 6: FUTURE SCOPE */}
			<section className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex flex-col items-center justify-center px-6 py-32 text-center relative overflow-hidden bg-slate-900 text-white">
				<div className="absolute inset-0 -z-10 opacity-20">
					<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-verdigris-500/50 to-transparent blur-3xl" />
				</div>
				
				<div className="max-w-[1200px] mx-auto w-full relative z-10">
					<div className="inline-flex items-center justify-center p-6 rounded-full bg-white/5 border border-white/10 mb-12 shadow-[0_0_100px_rgba(234,179,8,0.2)]">
						<Zap className="h-12 w-12 text-yellow-400 animate-pulse" />
					</div>
					
					<h2 className="text-5xl sm:text-7xl font-black tracking-tight mb-8">What's Next?</h2>
					<p className="text-xl text-slate-400 max-w-2xl mx-auto mb-20 font-light">
						We are continuously exploring boundaries. Here is the roadmap for the future iterations of the LiPy engine.
					</p>
					
					<div className="flex flex-wrap justify-center gap-4 sm:gap-6">
						{FUTURE_WORK.map((item) => (
							<div key={item} className="group relative">
								<div className="absolute inset-0 bg-gradient-to-r from-verdigris-500 to-blue-500 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
								<span className="relative flex items-center text-base sm:text-xl font-semibold px-8 py-4 rounded-full bg-slate-950 border border-white/10 transition-transform duration-300 group-hover:-translate-y-1">
									{item}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
	);
}
