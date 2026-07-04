"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
	GraduationCap,
	Users2,
	ChevronRight,
	Layers,
	Cpu,
	Server,
	Scan,
	PenLine,
	PenTool,
	Database,
	Sparkles,
	Target
} from "lucide-react";
import { STATS, CHALLENGES, STACK } from "@/constants/about";
import { PredictionCard } from "@/components/ocr/results/PredictionCard";
import type { PredictionResponse } from "@/types/ocr";

const SLIDES = [
	{ shortTitle: "Welcome", subtitle: "01 / INTRODUCTION", title: "Meet LiPy" },
	{ shortTitle: "Vision & Scope", subtitle: "02 / VISION & MISSION", title: "Odia Script OCR" },
	{ shortTitle: "Ecosystem", subtitle: "03 / SYSTEM PIPELINE", title: "Workflow Pipeline" },
	{ shortTitle: "Obstacles", subtitle: "04 / TECHNICAL CHALLENGES", title: "Script Obstacles" },
	{ shortTitle: "Metrics & Stack", subtitle: "05 / DATA & TECHNOLOGY", title: "Scale & Stack" },
	{ shortTitle: "Roadmap", subtitle: "06 / FUTURE DIRECTIVES", title: "The Road Ahead" }
];

const MOCK_PREDICTION: PredictionResponse = {
	prediction: "CONS_KHA",
	confidence: 0.912,
	top_predictions: [
		{ label: "CONS_KHA", confidence: 0.912 },
		{ label: "CONS_SHA", confidence: 0.054 },
		{ label: "CONS_GA", confidence: 0.021 }
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
			<aside className="hidden lg:flex w-72 border-r border-verdigris-200/50 dark:border-white/5 bg-white/40 dark:bg-[#0b1917]/20 backdrop-blur-md flex-shrink-0 flex-col justify-start p-6 pt-16 xl:pt-20">
				<nav className="space-y-2">
					{SLIDES.map((slide, idx) => (
						<button
							key={idx}
							onClick={() => scrollToSlide(idx)}
							className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
								activeSlide === idx
									? "bg-verdigris-900 text-white dark:bg-verdigris-200 dark:text-slate-950 shadow-md shadow-verdigris-500/10 scale-[1.02]"
									: "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-verdigris-900/5 dark:hover:bg-white/5"
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
						<div className="flex justify-between items-center border-b border-verdigris-200/40 dark:border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-600 dark:text-verdigris-400">
								01 / INTRODUCTION
							</span>

						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							<div className="lg:col-span-7 space-y-6">

								<h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
									Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-verdigris-600 via-verdigris-500 to-verdigris-400 dark:from-verdigris-400 dark:to-verdigris-300">LiPy</span>
								</h1>

								<p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl">
									An intelligent machine learning workspace focused on handwritten Odia character recognition, structured around three primary goals:
								</p>

								<ul className="space-y-3 max-w-xl text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
									<li className="flex items-start gap-3">
										<div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verdigris-500" />
										<span><strong>Structured OCR Pipeline:</strong> Preprocesses raw image scans to 64x64 grids, normalized for immediate tensor evaluation.</span>
									</li>
									<li className="flex items-start gap-3">
										<div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verdigris-500" />
										<span><strong>Deep Learning Core:</strong> Utilizes Convolutional Neural Networks (CNN) with Batch Normalization to handle stroke variance.</span>
									</li>
									<li className="flex items-start gap-3">
										<div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verdigris-500" />
										<span><strong>Regional AI Support:</strong> Addresses the dataset scarcity for Indic scripts through open crowdsourcing interfaces.</span>
									</li>
								</ul>

								<div className="pt-2">
									<Link
										href="/"
										className="inline-flex items-center gap-2 px-5 py-2.5 bg-verdigris-900 text-white dark:bg-verdigris-200 dark:text-slate-950 rounded-xl text-xs font-bold tracking-wider hover:opacity-90 transition-all shadow-md shadow-verdigris-900/10"
									>
										Try OCR Workspace
										<ChevronRight className="h-4 w-4" />
									</Link>
								</div>
							</div>

							{/* Right: Actual Result Page Card */}
							<div className="lg:col-span-5 hidden md:block w-full max-w-sm">
								<PredictionCard prediction={MOCK_PREDICTION} />
							</div>
						</div>


					</div>
				</div>

				{/* SLIDE 2: ACADEMIC CONTEXT */}
				<div
					ref={(el) => {
						slideRefs.current[1] = el;
					}}
					data-slide-index="1"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-verdigris-200/40 dark:border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-600 dark:text-verdigris-400">
								02 / VISION & MISSION
							</span>

						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							<div className="lg:col-span-7 space-y-6">
								<h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-3">
									<Target className="h-7 w-7 text-verdigris-600 dark:text-verdigris-400" />
									The Project Vision
								</h2>

								<p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
									Odia handwriting recognition represents a significant spatial classification challenge due to structural script complexity and stroke variance. LiPy aims to establish a robust, open-source pipeline to preserve and digitize the script.
								</p>

								<p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 font-semibold text-verdigris-700 dark:text-verdigris-400">
									By providing optimized models and a web-based crowdsourcing ecosystem, we lower the barrier for Odia language computational research.
								</p>
							</div>

							{/* Right: Core Objectives Cards */}
							<div className="lg:col-span-5 flex flex-col gap-4">
								<div className="p-5 border border-verdigris-900/10 dark:border-white/5 rounded-xl bg-white/60 dark:bg-verdigris-900/10 shadow-sm hover:border-verdigris-500/30 transition-all">
									<div className="flex items-center gap-3 mb-2">
										<div className="p-2 bg-verdigris-500/10 text-verdigris-600 dark:text-verdigris-400 rounded-lg">
											<Sparkles className="h-5 w-5" />
										</div>
										<h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
											Preservation & Utility
										</h4>
									</div>
									<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
										Building tools to convert historical manuscripts and handwriting into machine-readable digital archives.
									</p>
								</div>

								<div className="p-5 border border-verdigris-900/10 dark:border-white/5 rounded-xl bg-white/60 dark:bg-verdigris-900/10 shadow-sm hover:border-verdigris-500/30 transition-all">
									<div className="flex items-center gap-3 mb-2">
										<div className="p-2 bg-verdigris-500/10 text-verdigris-600 dark:text-verdigris-400 rounded-lg">
											<Layers className="h-5 w-5" />
										</div>
										<h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
											Indic Script Modeling
										</h4>
									</div>
									<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
										Synthesizing modern computer vision and deep learning techniques to advance native language modeling.
									</p>
								</div>
							</div>
						</div>


					</div>
				</div>

				{/* SLIDE 3: SYSTEM ECOSYSTEM */}
				<div
					ref={(el) => {
						slideRefs.current[2] = el;
					}}
					data-slide-index="2"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-verdigris-200/40 dark:border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-600 dark:text-verdigris-400">
								03 / SYSTEM PIPELINE
							</span>

						</div>

						{/* Body */}
						<div className="flex flex-col justify-center my-auto space-y-8">
							<div className="text-center max-w-xl mx-auto">
								<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
									The End-to-End Pipeline
								</h2>
								<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
									How handwritten strokes translate to high-accuracy digitized character classes.
								</p>
							</div>

							<div className="grid grid-cols-5 gap-3 items-stretch py-2">
								{[
									{ step: "01", name: "Draw / Upload", desc: "User inputs character on the drawing canvas or uploads file.", icon: PenLine },
									{ step: "02", name: "Processing", desc: "OpenCV segmentations normalize pixels and remove background noise.", icon: Layers },
									{ step: "03", name: "CNN Model", desc: "Convolutional Neural Network classifies character pixels.", icon: Cpu },
									{ step: "04", name: "Inference", desc: "FastAPI endpoint handles network requests with minimal latency.", icon: Server },
									{ step: "05", name: "Result UI", desc: "React dashboard presents class predictions and confidence.", icon: Scan }
								].map((item, idx) => (
									<div
										key={idx}
										className="group p-4 border border-verdigris-900/10 dark:border-white/5 rounded-xl bg-white/50 dark:bg-verdigris-950/40 hover:border-verdigris-500/30 dark:hover:border-verdigris-400/30 hover:shadow-md transition-all flex flex-col justify-between text-center"
									>
										<div className="flex flex-col items-center">
											<div className="mb-3 p-2 bg-verdigris-500/10 text-verdigris-600 dark:text-verdigris-400 rounded-lg group-hover:scale-110 transition-transform">
												<item.icon className="h-5 w-5" />
											</div>
											<h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1">
												{item.name}
											</h4>
											<p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
												{item.desc}
											</p>
										</div>
										<div className="mt-2 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-600">
											STEP {item.step}
										</div>
									</div>
								))}
							</div>
						</div>


					</div>
				</div>

				{/* SLIDE 4: CHALLENGES */}
				<div
					ref={(el) => {
						slideRefs.current[3] = el;
					}}
					data-slide-index="3"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-verdigris-200/40 dark:border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-600 dark:text-verdigris-400">
								04 / TECHNICAL CHALLENGES
							</span>

						</div>

						{/* Body */}
						<div className="flex flex-col justify-center my-auto space-y-6">
							<div className="text-left">
								<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
									Navigating Script Complexity
								</h2>
								<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
									Biological writing habits present unique problems for machine learning algorithms.
								</p>
							</div>

							<div className="grid grid-cols-3 gap-6 items-stretch py-2">
								{CHALLENGES.map((item, idx) => {
									const Icon = [PenTool, Database, Scan][idx % 3];
									return (
										<div
											key={idx}
											className="p-5 border border-verdigris-900/10 dark:border-white/5 rounded-xl bg-white/50 dark:bg-verdigris-950/40 hover:border-verdigris-500/30 transition-all flex flex-col justify-between"
										>
											<div>
												<div className="flex items-center justify-between mb-4">
													<span className="text-2xl font-mono font-black text-verdigris-500/30 dark:text-verdigris-400/20">
														0{idx + 1}
													</span>
													<Icon className="h-5 w-5 text-verdigris-600 dark:text-verdigris-400" />
												</div>
												<h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
													{item.title}
												</h4>
												<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
													{item.description}
												</p>
											</div>
											<div className="mt-4 text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
												Script Issue
											</div>
										</div>
									);
								})}
							</div>
						</div>


					</div>
				</div>

				{/* SLIDE 5: METRICS & STACK */}
				<div
					ref={(el) => {
						slideRefs.current[4] = el;
					}}
					data-slide-index="4"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-verdigris-200/40 dark:border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-600 dark:text-verdigris-400">
								05 / DATA & TECHNOLOGY
							</span>

						</div>

						{/* Body */}
						<div className="grid lg:grid-cols-12 gap-8 items-center my-auto">
							{/* Left: Stats */}
							<div className="lg:col-span-6 space-y-6">
								<div>
									<h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
										By The Numbers
									</h2>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
										Dataset scale and neural network properties.
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									{STATS.map((item, idx) => {
										const label = item.label === "Project Type" ? "Development Phase" : item.label;
										const value = item.value === "Internship Project" ? "Beta Release" : item.value;
										return (
											<div
												key={idx}
												className="p-4 border border-verdigris-900/10 dark:border-white/5 rounded-xl bg-white/40 dark:bg-verdigris-950/20 text-center"
											>
												<div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
													{value}
												</div>
												<div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
													{label}
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Right: Stack */}
							<div className="lg:col-span-6 space-y-3">
								<h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
									Core Technology Stack
								</h3>
								<div className="flex flex-col gap-2">
									{STACK.map((item, idx) => (
										<div
											key={idx}
											className="flex justify-between items-center p-3 border border-verdigris-900/5 dark:border-white/5 rounded-xl bg-white/60 dark:bg-verdigris-900/10 hover:border-verdigris-500/20 transition-colors"
										>
											<div>
												<div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
													{item.title}
												</div>
												<div className="text-xs font-bold text-slate-800 dark:text-slate-200">
													{item.value}
												</div>
											</div>
											<span className="px-2.5 py-0.5 rounded-full bg-verdigris-500/10 text-verdigris-600 dark:text-verdigris-400 text-[9px] font-mono font-bold border border-verdigris-500/10">
												Verified
											</span>
										</div>
									))}
								</div>
							</div>
						</div>


					</div>
				</div>

				{/* SLIDE 6: ROADMAP */}
				<div
					ref={(el) => {
						slideRefs.current[5] = el;
					}}
					data-slide-index="5"
					className="snap-start min-h-[calc(100dvh-4.5rem)] w-full flex items-center justify-center p-6 sm:p-8"
				>
					<div className="panel p-8 sm:p-12 w-full max-w-[94%] xl:max-w-7xl h-full max-h-[85vh] flex flex-col justify-between rounded-2xl relative shadow-xl overflow-hidden">
						{/* Header */}
						<div className="flex justify-between items-center border-b border-verdigris-200/40 dark:border-white/5 pb-4">
							<span className="text-[10px] font-bold tracking-[0.25em] uppercase text-verdigris-600 dark:text-verdigris-400">
								06 / FUTURE DIRECTIVES
							</span>

						</div>

						{/* Body */}
						<div className="flex flex-col justify-center my-auto space-y-6">
							<div className="text-center max-w-xl mx-auto">
								<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
									The Road Ahead
								</h2>
								<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
									Our development pipeline and goals for future system iterations.
								</p>
							</div>

							<div className="grid grid-cols-4 gap-4 items-stretch py-2">
								{[
									{ phase: "Phase 1", title: "Dataset Growth", desc: "Expanding classes to cover complex and composite Odia letter combinations." },
									{ phase: "Phase 2", title: "Model Pruning", desc: "Optimizing layers for minimal CPU load and sub-10ms inference." },
									{ phase: "Phase 3", title: "Sentence OCR", desc: "Implementing line and word segmentation to recognize complete script sheets." },
									{ phase: "Phase 4", title: "Developer APIs", desc: "Deploying secure researcher gateways for third-party script integrations." }
								].map((item, idx) => (
									<div
										key={idx}
										className="p-4 border border-verdigris-900/10 dark:border-white/5 rounded-xl bg-white/50 dark:bg-verdigris-950/40 flex flex-col justify-between hover:border-verdigris-500/30 transition-all"
									>
										<div>
											<span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-verdigris-700 dark:text-verdigris-300 bg-verdigris-500/10 rounded-full border border-verdigris-500/20">
												{item.phase}
											</span>
											<h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-4 mb-1">
												{item.title}
											</h4>
											<p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
												{item.desc}
											</p>
										</div>
										<div className="mt-4 text-[8px] font-mono text-slate-400 dark:text-slate-600">
											ROADMAP
										</div>
									</div>
								))}
							</div>
						</div>


					</div>
				</div>
			</div>
		</main>
	);
}
