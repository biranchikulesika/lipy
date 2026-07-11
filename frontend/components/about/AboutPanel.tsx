"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import {
	ChevronRight,
	Layers,
	Cpu,
	Server,
	Scan,
	PenTool,
	Database,
	Sparkles,
	Target,
	ArrowUpRight,
	ArrowDownRight,
	Cloud,
	Route,
	Github
} from "lucide-react";
import { PredictionCard } from "@/components/ocr/results/PredictionCard";
import type { PredictionResponse } from "@/types/ocr";

const SLIDES = [
	{ shortTitle: "Welcome", subtitle: "01 / INTRODUCTION", title: "Meet LiPy" },
	{ shortTitle: "Collection", subtitle: "02 / DATA COLLECTION", title: "LiPy Dataset Collection" },
	{ shortTitle: "Training", subtitle: "03 / MODEL TRAINING", title: "Model Training" },
	{ shortTitle: "Deployment", subtitle: "04 / SYSTEM DEPLOYMENT", title: "System Deployment" },
	{ shortTitle: "Pipeline", subtitle: "05 / INFERENCE WORKFLOW", title: "Inference Workflow" },
	{ shortTitle: "Challenges", subtitle: "06 / TECHNICAL CHALLENGES", title: "Technical Challenges" },
	{ shortTitle: "Metrics", subtitle: "07 / SYSTEM SCALE", title: "System Metrics" },
	{ shortTitle: "Stack", subtitle: "08 / TECH STACK", title: "Technology Stack" },
	{ shortTitle: "Roadmap", subtitle: "09 / DEVELOPMENT ROADMAP", title: "Roadmap" }
];

const MOCK_PREDICTION: PredictionResponse = {
	status: "success",
	prediction: "CONS_KHA",
	confidence: 0.912,
	character: "ଖ",
	reason: null,
	top_predictions: [
		{ label: "CONS_KHA", confidence: 0.912, character: "ଖ" },
		{ label: "CONS_SHA", confidence: 0.054, character: "ଶ" },
		{ label: "CONS_GA", confidence: 0.021, character: "ଗ" }
	]
};

export function AboutPanel() {
	const [activeSlide, setActiveSlide] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

	// Initialize slide refs
	if (slideRefs.current.length !== SLIDES.length) {
		slideRefs.current = Array(SLIDES.length).fill(null);
	}

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const index = Number(entry.target.getAttribute("data-slide-index"));
						if (!isNaN(index)) {
							setActiveSlide(index);
						}
					}
				});
			},
			{
				root: container,
				threshold: 0.5,
			}
		);

		slideRefs.current.forEach((slide) => {
			if (slide) observer.observe(slide);
		});

		return () => observer.disconnect();
	}, []);

	const scrollToSlide = (index: number) => {
		slideRefs.current[index]?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
		setActiveSlide(index);
	};



	return (
		<main className="w-full h-[calc(100dvh-4.5rem)] flex bg-transparent overflow-hidden">
			{/* PowerPoint Sidebar Sorter - Left Side */}
			<aside className="hidden lg:flex w-72 border-r border-white/5 bg-[#0b1917]/20 backdrop-blur-md flex-shrink-0 flex-col justify-start p-6 pt-16 xl:pt-20">
				<nav className="space-y-2">
					{SLIDES.map((slide, idx) => (
						<button
							key={idx}
							onClick={() => scrollToSlide(idx)}								className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
								activeSlide === idx
									? "bg-verdigris-200 text-slate-950 shadow-md shadow-verdigris-500/10 scale-[1.02]"
									: "text-slate-400 hover:text-slate-200 hover:bg-white/5"
							}`}
						>
							<span className={`text-[10px] font-mono opacity-60 ${activeSlide === idx ? "opacity-100" : ""}`}>
								0{idx + 1}
							</span>
							<span className="truncate">{slide.shortTitle}</span>
						</button>
					))}
				</nav>
			</aside>

			{/* Slide Viewer / Snap-scroll Container */}
			<div
				ref={containerRef}
				className="flex-1 h-[calc(100dvh-4.5rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-none flex flex-col items-center"
			>
				{/* SLIDE 1: WELCOME & HERO */}
				<div
					ref={(el) => {
						slideRefs.current[0] = el;
					}}
					data-slide-index="0"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								01 / INTRODUCTION
							</span>
						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							<div className="lg:col-span-7 space-y-6">
								<h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight flex flex-wrap items-center gap-3">
									Meet <Logo size="xl" />
								</h1>

								<p className="text-base sm:text-lg leading-relaxed text-slate-400 max-w-xl">
									An Odia handwritten character recognition machine learning project developed under the internship of NIELIT Bhubaneswar.
								</p>

								<div className="pt-2 flex items-center gap-3">
									<Link                href="/"
                className="inline-flex items-center justify-center gap-2 w-[135px] py-3 bg-verdigris-200 text-slate-950 rounded-xl text-sm font-bold tracking-wider hover:opacity-90 transition-all shadow-md shadow-verdigris-900/10"
									>
										Try Now
										<ChevronRight className="h-4 w-4" />
									</Link>
									<a
										href="https://github.com/biranchikulesika/lipy"
										target="_blank"
										rel="noopener noreferrer"                className="inline-flex items-center justify-center gap-2 w-[135px] py-3 border border-white/5 bg-slate-950/20 rounded-xl text-sm font-bold tracking-wider hover:bg-white/5 transition-all text-slate-200 shadow-sm"
									>
										<Github className="h-4 w-4" />
										GitHub
									</a>
								</div>
							</div>

							{/* Right: Actual Result Page Card */}
							<div className="lg:col-span-5 hidden md:block w-full max-w-sm">
								<PredictionCard prediction={MOCK_PREDICTION} />
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 2: DATA COLLECTION */}
				<div
					ref={(el) => {
						slideRefs.current[1] = el;
					}}
					data-slide-index="1"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								02 / DATA COLLECTION
							</span>
						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							<div className="lg:col-span-5 space-y-4">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-2">
									<Database className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight flex flex-wrap items-center gap-2">
									<Logo size="lg" /> Dataset Collection
								</h2>
								<p className="text-sm sm:text-base leading-relaxed text-slate-400">
									Crowdsourcing odia handwriting samples through LiPyD.
								</p>
							</div>

							{/* Right: Unified Data Collection Pipeline Diagram */}
							<div className="lg:col-span-7 w-full p-6 border border-white/5 rounded-3xl bg-[#071312]/30 backdrop-blur-md shadow-lg flex flex-col justify-between h-[52vh] max-h-[420px] relative overflow-hidden">
								{/* Tab Header */}
								<div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
									<div className="flex items-center gap-1.5">
										<span className="w-2 h-2 rounded-full bg-verdigris-500/80" />
										<span className="w-2 h-2 rounded-full bg-verdigris-400/80" />
										<span className="w-2 h-2 rounded-full bg-verdigris-300/80" />
									</div>            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
										LiPyD Crowdsourcing Pipeline
									</span>
								</div>

								{/* Diagram Contents: Zigzag Timeline */}
								<div className="flex-grow relative min-h-0 flex items-center justify-center">
									{/* Horizontal Bezier Wave Background */}
									<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 300 100" preserveAspectRatio="none">
										<path d="M 0,50 C 75,-10 75,110 150,50 C 225,-10 225,110 300,50" />
									</svg>

									<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
										{/* Step 1: Register Node (Top-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="flex flex-col items-center justify-center h-[185px] w-full p-3 gap-2.5 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm">
												<div className="text-sm lg:text-base font-black text-white leading-none">
													User Register
												</div>
												<div className="w-full max-w-[155px] h-[95px] text-left bg-verdigris-950/20 p-2.5 rounded-lg border border-verdigris-900/5 flex flex-col justify-center space-y-0.5 font-mono text-[9px] text-slate-350 leading-tight">
													<div className="font-bold text-slate-100 text-[10.5px] border-b border-white/5 pb-0.5 mb-1 uppercase tracking-wide">Contributor</div>
													<div className="truncate"><span className="text-slate-400">name:</span> "Biranchi K."</div>
													<div className="truncate"><span className="text-slate-400">mode:</span> "mixed-random"</div>
												</div>
											</div>
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
											<div className="h-4" />
										</div>

										{/* Connector 1 */}
										<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
											<ArrowDownRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
										</div>

										{/* Step 2: Donate Samples (Bottom-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="h-4" />
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
											<div className="flex flex-col items-center justify-center h-[185px] w-full p-3 gap-2.5 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm">
												<div className="text-sm lg:text-base font-black text-white leading-none">
													Drawing Canvas
												</div>
												<div className="w-full max-w-[155px] h-[95px] text-left bg-verdigris-950/20 p-2.5 rounded-lg border border-verdigris-900/5 flex flex-col justify-between font-mono text-[8px] text-slate-350 leading-tight">
													<div className="font-bold text-slate-100 text-[9.5px] border-b border-white/5 pb-0.5 uppercase tracking-wide">Drawing Canvas</div>
													<div className="flex items-center justify-between gap-1 w-full flex-grow mt-1.5">
														<div className="flex flex-col justify-center space-y-1">
															<div className="truncate"><span className="text-slate-400">target:</span> "VOW_U"</div>
															<div className="truncate"><span className="text-slate-400">total:</span> 2002</div>
														</div>
														<div className="w-[50px] h-[50px] border border-slate-800 rounded bg-[#0a1413] relative overflow-hidden shrink-0 flex items-center justify-center">
															<div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:4px_4px]" />
															<svg className="h-[34px] w-[34px] stroke-verdigris-400 stroke-[3.5] fill-none" viewBox="0 0 100 100">
																<path d="M 30,30 C 55,20 75,40 50,70 C 40,80 30,55 60,55 C 70,55 80,60 80,75" />
															</svg>
														</div>
													</div>
												</div>
											</div>
										</div>

										{/* Connector 2 */}
										<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
											<ArrowUpRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
										</div>

										{/* Step 3: Synced to DB (Top-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="flex flex-col items-center justify-center h-[185px] w-full p-3 gap-2.5 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm">
												<div className="text-sm lg:text-base font-black text-white leading-none">
													Synced to DB
												</div>
												<div className="w-full max-w-[155px] h-[95px] text-left bg-verdigris-950/20 p-2.5 rounded-lg border border-verdigris-900/5 flex flex-col justify-center space-y-0.5 font-mono text-[9px] text-slate-350 leading-tight">
													<div className="font-bold text-slate-100 text-[10.5px] border-b border-white/5 pb-0.5 mb-1 uppercase tracking-wide">Supabase Storage</div>
													<div className="truncate"><span className="text-slate-400">table:</span> "lipy_samples"</div>
													<div className="truncate"><span className="text-slate-400">path:</span> "storage_path"</div>
												</div>
											</div>
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
											<div className="h-4" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 3: MODEL TRAINING */}
				<div
					ref={(el) => {
						slideRefs.current[2] = el;
					}}
					data-slide-index="2"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								03 / MODEL TRAINING
							</span>
						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							<div className="lg:col-span-5 space-y-4">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-2">
									<Cpu className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
									Model Training
								</h2>
								<p className="text-sm sm:text-base leading-relaxed text-slate-400">
									EfficientNetB0 trained on 64×64 images from the Hugging Face dataset.
								</p>
							</div>

							{/* Right: High-Fidelity Wave Infographic Timeline */}
							<div className="lg:col-span-7 w-full p-5 border border-white/5 rounded-3xl bg-[#071312]/30 backdrop-blur-md shadow-lg flex flex-col justify-between h-[52vh] max-h-[420px] relative overflow-hidden">
								{/* Tab Header */}
								<div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4">            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
										Model Training Pipeline (L.ipynb)
									</span>
									<span className="px-2 py-0.5 rounded-full bg-verdigris-500/10 text-verdigris-400 text-[9px] font-mono font-bold">
										GPU Active
									</span>
								</div>

								{/* Infographic Steps with Zigzag Connecting Arrows */}
								<div className="flex-1 relative min-h-0 flex items-center justify-center">
									{/* Horizontal Bezier Wave Background */}
									<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 400 100" preserveAspectRatio="none">
										<path d="M 0,50 C 100,-10 100,110 200,50 C 300,-10 300,110 400,50" />
									</svg>
									<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
										{/* Step 1: Download & Clean (Top-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
												<div className="text-sm font-black text-white leading-tight">Download DB</div>
												<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">Downloaded dataset from Hugging Face and filtered valid classes.</p>
											</div>
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
											<div className="h-4" />
										</div>

										{/* Connector 1 */}
										<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
											<ArrowDownRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
										</div>

										{/* Step 2: Drive Upload (Bottom-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="h-4" />
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
											<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
												<div className="text-sm font-black text-white leading-tight">Drive Upload</div>
												<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">Cleaned dataset uploaded to Google Drive.</p>
											</div>
										</div>

										{/* Connector 2 */}
										<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
											<ArrowUpRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
										</div>

										{/* Step 3: Colab Import (Top-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
												<div className="text-sm font-black text-white leading-tight">Colab Import</div>
												<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">Drive dataset imported on Colab kernel.</p>
											</div>
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
											<div className="h-4" />
										</div>

										{/* Connector 3 */}
										<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
											<ArrowDownRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
										</div>

										{/* Step 4: CNN Training (Bottom-weighted) */}
										<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
											<div className="h-4" />
											<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
											<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
												<div className="text-sm font-black text-white leading-tight">Train EfficientNetB0</div>
												<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">Trained EfficientNetB0 and exported model weights.</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 4: SYSTEM DEPLOYMENT */}
				<div
					ref={(el) => {
						slideRefs.current[3] = el;
					}}
					data-slide-index="3"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								04 / SYSTEM DEPLOYMENT
							</span>
						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							<div className="lg:col-span-5 space-y-4">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-2">
									<Server className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
									System Deployment
								</h2>
								<p className="text-sm sm:text-base leading-relaxed text-slate-400">
									Automated hosting architecture built with Vercel and Azure, synced in real-time via GitHub commits.
								</p>
							</div>

							{/* Right: High-Fidelity CI/CD Deployment Map */}
							<div className="lg:col-span-7 w-full p-5 border border-white/5 rounded-3xl bg-[#071312]/30 backdrop-blur-md shadow-lg flex flex-col justify-between h-[52vh] max-h-[420px] relative overflow-hidden">
								{/* Tab Header */}
								<div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">            <span className="text-[10px] lg:text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
										CI/CD Deployment Architecture
									</span>
									<span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold">
										Live Production
									</span>
								</div>

								{/* 3-Node Architecture Grid */}
								<div className="flex-grow relative flex flex-col justify-between p-2 min-h-0">
									{/* Central Source: GitHub */}
									<div className="flex justify-center">
										<div className="p-3 border border-slate-800 rounded-xl bg-slate-950/40 text-center w-[160px] space-y-1 shadow-sm z-10">
											<div className="text-sm font-black text-white leading-none">GitHub Repo</div>
											<div className="text-[10.5px] lg:text-xs text-slate-400 font-mono">Pushed changes</div>
										</div>
									</div>

									{/* Diagonal connecting arrows / pathways */}
									<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
										<svg className="w-full h-full stroke-verdigris-400/20 fill-none stroke-[1.5] stroke-dasharray-[3]" viewBox="0 0 300 150">
											{/* GitHub -> Vercel */}
											<path d="M 130,40 L 70,100" />
											{/* GitHub -> Azure */}
											<path d="M 170,40 L 230,100" />
											{/* Vercel <-> Azure */}
											<path d="M 90,115 L 210,115" />
										</svg>
									</div>

									{/* Labels for pathways */}
									<div className="absolute top-[55px] left-[25px] text-[8.5px] lg:text-[9.5px] font-mono text-slate-400 font-bold uppercase">Auto Build</div>
									<div className="absolute top-[55px] right-[25px] text-[8.5px] lg:text-[9.5px] font-mono text-slate-400 font-bold uppercase">Auto Deploy</div>
									<div className="absolute bottom-[35px] left-1/2 -translate-x-1/2 text-[8.5px] lg:text-[9.5px] font-mono text-verdigris-400 font-bold uppercase bg-slate-950 px-2 py-0.5 rounded border border-verdigris-500/10 z-10">REST API Requests</div>

									{/* Hosts: Vercel & Azure */}
									<div className="flex justify-between items-center w-full px-2 z-10">
										{/* Vercel Node */}
										<div className="p-3 border border-white/5 rounded-xl bg-verdigris-950/50 text-center w-[145px] space-y-1 shadow-sm">
											<div className="text-sm font-black text-white leading-none">Vercel</div>
											<div className="text-[10.5px] lg:text-xs text-emerald-500 font-bold">Frontend Host</div>
										</div>

										{/* Azure Node */}
										<div className="p-3 border border-white/5 rounded-xl bg-verdigris-950/50 text-center w-[145px] space-y-1 shadow-sm">
											<div className="text-sm font-black text-white leading-none">Azure</div>
											<div className="text-[10.5px] lg:text-xs text-emerald-500 font-bold">FastAPI Backend</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 5: SYSTEM ECOSYSTEM */}
				<div
					ref={(el) => {
						slideRefs.current[4] = el;
					}}
					data-slide-index="4"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								05 / INFERENCE WORKFLOW
							</span>
						</div>

						{/* Body */}
						<div className="flex flex-col justify-center my-auto space-y-8">
							<div className="text-center max-w-xl mx-auto flex flex-col items-center">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-4">
									<Scan className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
									Inference Pipeline
								</h2>
								<p className="text-sm sm:text-base text-slate-400 mt-2">
									How handwritten strokes translate to digitized character classifications.
								</p>
							</div>

							{/* Infographic Steps with Zigzag Connecting Arrows */}
							<div className="flex-grow relative min-h-0 flex items-center justify-center py-6">
								{/* Horizontal Bezier Wave Background */}
								<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 500 100" preserveAspectRatio="none">
									<path d="M 0,50 C 125,-10 125,110 250,50 C 375,-10 375,110 500,50" />
								</svg>

								<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
									{/* Step 1: Input Character (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
											<div className="text-sm font-black text-white leading-tight">Input Character</div>
											<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">User draws a character on the canvas board or uploads an image.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 1 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 2: Preprocessing (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
											<div className="text-sm font-black text-white leading-tight">Preprocessing</div>
											<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">Grayscales, normalizes pixel intensities, and resizes to 64x64 matrix.</p>
										</div>
									</div>

									{/* Connector 2 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowUpRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 3: CNN Inference (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
											<div className="text-sm font-black text-white leading-tight">CNN Inference</div>
											<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">Feature maps computed through Conv2D blocks to output class scores.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 3 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 4: API Response (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
											<div className="text-sm font-black text-white leading-tight">API Response</div>
											<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">FastAPI backend returns prediction results and confidence values.</p>
										</div>
									</div>

									{/* Connector 4 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowUpRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 5: Render Output (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col justify-center h-[145px] w-full p-3 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-1">
											<div className="text-sm font-black text-white leading-tight">Render Output</div>
											<p className="text-[10.5px] lg:text-xs text-slate-400 leading-relaxed mt-1">UI maps label keys to Odia glyphs and displays predictions to user.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 6: CHALLENGES */}
				<div
					ref={(el) => {
						slideRefs.current[5] = el;
					}}
					data-slide-index="5"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								06 / TECHNICAL CHALLENGES
							</span>
						</div>
						<div className="flex flex-col justify-center my-auto space-y-8">
							<div className="text-center max-w-xl mx-auto flex flex-col items-center">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-4">
									<Target className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
									Technical Challenges
								</h2>
								<p className="text-sm sm:text-base text-slate-400 mt-2">
									Key script obstacles encountered when training neural models on handwritten Odia data.
								</p>
							</div>

							{/* Infographic Steps with Zigzag Connecting Arrows */}
							<div className="flex-grow relative min-h-0 flex items-center justify-center py-6">
								{/* Horizontal Bezier Wave Background */}
								<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 300 100" preserveAspectRatio="none">
									<path d="M 0,50 C 75,-10 75,110 150,50 C 225,-10 225,110 300,50" />
								</svg>

								<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
									{/* Card 1: Handwriting Variability (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col justify-center h-[185px] w-full p-4 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-2">
											<div className="p-2 bg-verdigris-500/10 text-verdigris-400 rounded-xl w-fit mx-auto">
												<PenTool className="h-5 w-5" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-none">Handwriting Variability</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1">Different writers produce characters with varying stroke sizes, shapes, and speeds.</p>
											<div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-center gap-2">
												<span className="text-xs font-mono text-slate-400 line-through">କ</span>
												<span className="text-xs font-mono text-verdigris-550 font-bold">କ</span>
											</div>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 1 */}
									<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
									</div>

									{/* Card 2: Limited Public Datasets (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col justify-center h-[185px] w-full p-4 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-2">
											<div className="p-2 bg-verdigris-500/10 text-verdigris-400 rounded-xl w-fit mx-auto">
												<Database className="h-5 w-5" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-none">Limited Public Datasets</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1">Handwritten Odia research lacks large, structured, and standardized repositories.</p>
											<div className="mt-2 pt-2 border-t border-white/5 space-y-1 w-full text-left">
												<div className="flex justify-between text-[8px] font-mono text-slate-500">
													<span>Dataset Volume</span>
													<span className="text-verdigris-550 font-bold">2,002+ samples</span>
												</div>
												<div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
													<div className="h-full bg-verdigris-500 w-[65%] rounded-full" />
												</div>
											</div>
										</div>
									</div>

									{/* Connector 2 */}
									<div className="flex-initial w-6 shrink-0 flex items-center justify-center">
										<ArrowUpRight className="h-6 w-6 text-verdigris-550 animate-pulse" />
									</div>

									{/* Card 3: Character Similarity (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col justify-center h-[185px] w-full p-4 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm space-y-2">
											<div className="p-2 bg-verdigris-500/10 text-verdigris-400 rounded-xl w-fit mx-auto">
												<Scan className="h-5 w-5" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-none">Character Similarity</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1">Visual overlaps in character curves make accurate classification highly difficult.</p>
											<div className="mt-2 pt-2 border-t border-white/5 flex flex-col items-center justify-center gap-0.5">
												<div className="flex gap-2 text-xs font-bold">
													<span className="text-slate-500">ଭ</span>
													<span className="text-slate-400 font-mono">≈</span>
													<span className="text-verdigris-550">ଉ</span>
												</div>
												<span className="text-[7px] font-mono text-red-500 font-bold leading-none">cons_bha ≈ vow_u</span>
											</div>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 7: SYSTEM METRICS */}
				<div
					ref={(el) => {
						slideRefs.current[6] = el;
					}}
					data-slide-index="6"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								07 / SYSTEM SCALE
							</span>
						</div>

						<div className="flex flex-col justify-center my-auto space-y-8">
							{/* Centered Page Header */}
							<div className="text-center max-w-xl mx-auto flex flex-col items-center">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-4">
									<Layers className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
									System Metrics
								</h2>
								<p className="text-sm sm:text-base text-slate-400 mt-2">
									By the numbers: character class distributions and dataset properties.
								</p>
							</div>

							{/* Infographic Steps with Zigzag Connecting Arrows */}
							<div className="flex-grow relative min-h-0 flex items-center justify-center py-6">
								{/* Horizontal Bezier Wave Background */}
								<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 400 100" preserveAspectRatio="none">
									<path d="M 0,50 C 100,-10 100,110 200,50 C 300,-10 300,110 400,50" />
								</svg>

								<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
									{/* Step 1: Classes (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Cpu className="h-4 w-4" />
											</div>
											<div className="text-2xl lg:text-3xl font-black text-white leading-none">41</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Classes</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Includes Odia independent vowels and consonant characters.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 1 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 2: Samples (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Database className="h-4 w-4" />
											</div>
											<div className="text-2xl lg:text-3xl font-black text-white leading-none">2,002+</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Samples</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Crowdsourced samples collected from active contributors via LiPyD canvas.</p>
										</div>
									</div>

									{/* Connector 2 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowUpRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 3: Model Architecture (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Scan className="h-4 w-4" />
											</div>
											<div className="text-2xl lg:text-3xl font-black text-white leading-none">EfficientNetB0</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Model Architecture</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">EfficientNetB0 trained on augmented handwritten samples.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 3 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 4: Development Phase (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Sparkles className="h-4 w-4" />
											</div>
											<div className="text-2xl lg:text-3xl font-black text-white leading-none">Beta Release</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Development Phase</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Operational web interface connected to cloud REST backend endpoints.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* SLIDE 8: TECHNOLOGY STACK */}
				<div
					ref={(el) => {
						slideRefs.current[7] = el;
					}}
					data-slide-index="7"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								08 / TECH STACK
							</span>
						</div>

						<div className="flex flex-col justify-center my-auto space-y-8">
							{/* Centered Page Header */}
							<div className="text-center max-w-xl mx-auto flex flex-col items-center">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-4">
									<Cpu className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
									Technology Stack
								</h2>
								<p className="text-sm sm:text-base text-slate-400 mt-2">
									Core frameworks and software architecture powering the platform.
								</p>
							</div>

							{/* Infographic Steps with Zigzag Connecting Arrows */}
							<div className="flex-grow relative min-h-0 flex items-center justify-center py-6">
								{/* Horizontal Bezier Wave Background */}
								<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 400 100" preserveAspectRatio="none">
									<path d="M 0,50 C 100,-10 100,110 200,50 C 300,-10 300,110 400,50" />
								</svg>

								<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
									{/* Step 1: Frontend (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Layers className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">Next.js + Tailwind</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Frontend Client</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Next.js frontend deployed on Vercel with canvas input and result dashboard.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 1 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 2: Backend (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Server className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">FastAPI</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Backend Engine</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">FastAPI inference service deployed on Azure with Hugging Face model loading.</p>
										</div>
									</div>

									{/* Connector 2 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowUpRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 3: ML (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Cpu className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">TensorFlow / Keras</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Machine Learning</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">EfficientNetB0 model loaded from Hugging Face Hub via TensorFlow/Keras.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 3 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 4: Deployment (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Cloud className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">Vercel & Azure</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Deployment Hosting</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Frontend on Vercel, backend on Azure, datasets on Hugging Face, data on Supabase.</p>
										</div>
									</div>
							</div>
						</div>
					</div>
				</div>
				</div>

				{/* SLIDE 9: ROADMAP */}
				<div
					ref={(el) => {
						slideRefs.current[8] = el;
					}}
					data-slide-index="8"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-400">
								09 / DEVELOPMENT ROADMAP
							</span>
						</div>

						{/* Body */}
						<div className="flex flex-col justify-center my-auto space-y-8">
							{/* Centered Page Header */}
							<div className="text-center max-w-xl mx-auto flex flex-col items-center">
								<div className="inline-flex p-4 bg-verdigris-500/10 text-verdigris-400 rounded-2xl mb-4">
									<Route className="h-12 w-12" />
								</div>
								<h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
									Roadmap
								</h2>
								<p className="text-sm sm:text-base text-slate-400 mt-2">
									Future milestones and feature roadmap for the LiPy ecosystem.
								</p>
							</div>

							{/* Infographic Steps with Zigzag Connecting Arrows */}
							<div className="flex-grow relative min-h-0 flex items-center justify-center py-6">
								{/* Horizontal Bezier Wave Background */}
								<svg className="absolute inset-x-0 w-full h-[80px] pointer-events-none stroke-verdigris-400/15 fill-none stroke-[2] stroke-dasharray-[4]" viewBox="0 0 400 100" preserveAspectRatio="none">
									<path d="M 0,50 C 100,-10 100,110 200,50 C 300,-10 300,110 400,50" />
								</svg>

								<div className="flex items-stretch justify-between gap-1 w-full h-full relative z-10">
									{/* Step 1: Phase 1 (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Database className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">Dataset Growth</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Phase 1</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Adding complex compound character classes to cover more ligature curves.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 1 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 2: Phase 2 (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Cpu className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">Model Pruning</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Phase 2</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Shrinking model weights and quantizing parameters for low-end mobile edges.</p>
										</div>
									</div>

									{/* Connector 2 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowUpRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 3: Phase 3 (Top-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Scan className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">Sentence OCR</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Phase 3</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Building line segmentation modules to scan whole paragraphs instead of characters.</p>
										</div>
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mt-auto mb-5" />
										<div className="h-4" />
									</div>

									{/* Connector 3 */}
									<div className="flex-initial w-5 shrink-0 flex items-center justify-center">
										<ArrowDownRight className="h-5 w-5 text-verdigris-550 animate-pulse" />
									</div>

									{/* Step 4: Phase 4 (Bottom-weighted) */}
									<div className="flex-[2] flex flex-col justify-between items-center text-center h-full py-1">
										<div className="h-4" />
										<div className="w-2.5 h-2.5 rounded-full bg-verdigris-500 border-2 border-slate-950 shadow animate-pulse mb-auto mt-5" />
										<div className="flex flex-col items-center justify-center h-[145px] w-full p-3 gap-1 border border-white/5 rounded-2xl bg-verdigris-950/50 shadow-sm text-center">
											<div className="p-1.5 bg-verdigris-500/10 text-verdigris-400 rounded-lg w-fit">
												<Server className="h-4 w-4" />
											</div>
											<div className="text-sm lg:text-base font-black text-white leading-tight">Developer APIs</div>
											<div className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">Phase 4</div>
											<p className="text-[10.5px] lg:text-xs leading-relaxed text-slate-400 mt-1 px-1">Exposing REST endpoints to academic researchers for script recognition.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
