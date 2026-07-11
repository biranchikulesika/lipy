"use client";

import { TEAM_MEMBERS, type TeamMember } from "@/constants/team";
import { Github, Linkedin, Mail, GraduationCap, Building2, UserCheck, Globe, Instagram, Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";

function TeamMemberAvatar({ name, photoFilename, validPhotos, className = "h-16 w-16" }: { name: string; photoFilename?: string; validPhotos: string[]; className?: string }) {
	const [error, setError] = useState(false);

	const isValidPhoto = photoFilename && validPhotos.includes(photoFilename);

	if (!isValidPhoto || error) {
		return (
			<div className={`flex shrink-0 items-center justify-center rounded-full bg-white/5 ${className}`}>
				<span className="text-xl font-bold tracking-tight text-slate-400 text-slate-500">
					{name.charAt(0)}
				</span>
			</div>
		);
	}

	return (
		<div className={`relative flex shrink-0 overflow-hidden rounded-full border border-verdigris-900/10 bg-verdigris-100 border-white/10 bg-verdigris-800 ${className}`}>
			<Image
				src={`/team/${photoFilename}`}
				alt={name}
				fill
				className="object-cover"
				onError={() => setError(true)}
			/>
		</div>
	);
}

function TeamMemberCard({ member, validPhotos, isFlipped, onFlip }: { member: TeamMember; validPhotos: string[]; isFlipped: boolean; onFlip: () => void }) {
	return (
		<div className="group flex flex-col h-[340px] w-[75vw] max-w-[260px] sm:h-[420px] sm:w-full sm:max-w-none shrink-0 snap-center rounded-[16px] border border-verdigris-700/20 bg-verdigris-950/40 backdrop-blur-md shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl hover:border-verdigris-400/30 relative">
			{/* Flippable Top Section */}
			<div
				className="relative flex-1 cursor-pointer [perspective:1200px]"
				onClick={onFlip}
			>
				<div
					className={`flip-card-inner ${
						isFlipped ? "flip-card-flipped" : ""
					}`}
				>
					{/* Front of Top Section */}
					<div
						className={`flip-card-front flex flex-col items-center justify-center p-6 rounded-t-[15px] bg-transparent transition-opacity duration-300 ${
							isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
						}`}
					>
						<div className="relative mb-4 sm:mb-5">
							{/* Outer ring gradient glow */}
							<div className="absolute -inset-1 bg-gradient-to-tr from-verdigris-500/20 to-[#d4a055]/30 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
							<div className="relative ring-2 ring-verdigris-400/25 rounded-full p-1 bg-verdigris-950/50">
								<TeamMemberAvatar name={member.name} photoFilename={member.photoFilename} validPhotos={validPhotos} className="h-20 w-20 sm:h-24 sm:w-24 transition-transform duration-300 group-hover:scale-[1.03]" />
							</div>
						</div>

						<div className="flex flex-col items-center">
							<h3 className="font-display text-lg font-bold text-verdigris-50 tracking-tight text-center">
								{member.name}
							</h3>
							<p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#d4a055] text-center">
								{member.role}
							</p>
						</div>
					</div>

					{/* Back of Top Section */}
					<div
						className={`flip-card-back flex flex-col items-center justify-start p-6 bg-verdigris-900/90 backdrop-blur-md rounded-t-[15px] transition-opacity duration-300 ${
							isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
						}`}
					>
						<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">
							Contributions
						</p>
						<div className="w-full flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-verdigris-200 scrollbar-thumb-verdigris-800">
							<ul className="flex flex-col gap-2.5">
								{member.contributions?.map((con, idx) => (
									<li key={idx} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-verdigris-400/5 border border-white/5 text-[12.5px] text-slate-200 transition-all duration-200 hover:bg-verdigris-400/10">
										<Check className="h-4 w-4 text-verdigris-400 shrink-0" />
										<span className="font-medium leading-tight text-left">{con}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* Static Bottom Section (Social Links) */}				<div
				className="relative z-20 flex h-[68px] shrink-0 items-center justify-center gap-4 border-t border-white/5 w-full bg-verdigris-950/60 backdrop-blur-md rounded-b-[15px]"
			>
				{member.social?.github && (
					<a
						href={member.social.github}
						target="_blank"
						rel="noreferrer"
						className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
						aria-label="GitHub"
					>
						<Github className="h-[18px] w-[18px]" />
					</a>
				)}

				{member.social?.linkedin && (
					<a
						href={member.social.linkedin}
						target="_blank"
						rel="noreferrer"
						className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all duration-200"
						aria-label="LinkedIn"
					>
						<Linkedin className="h-[18px] w-[18px]" />
					</a>
				)}

				{member.social?.website && (
					<a
						href={member.social.website}
						target="_blank"
						rel="noreferrer"
						className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all duration-200"
						aria-label="Website"
					>
						<Globe className="h-[18px] w-[18px]" />
					</a>
				)}

				{member.social?.email && (
					<a
						href={member.social.email.startsWith("mailto:") ? member.social.email : `mailto:${member.social.email}`}
						className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 transition-all duration-200"
						aria-label="Email"
					>
						<Mail className="h-[18px] w-[18px]" />
					</a>
				)}

				{member.social?.instagram && (
					<a
						href={member.social.instagram}
						target="_blank"
						rel="noreferrer"
						className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-pink-500 hover:bg-pink-500/5 transition-all duration-200"
						aria-label="Instagram"
					>
						<Instagram className="h-[18px] w-[18px]" />
					</a>
				)}
			</div>
		</div>
	);
}

export function TeamPanel({ validPhotos = [], members = TEAM_MEMBERS }: { validPhotos?: string[], members?: TeamMember[] }) {
	const [flippedMemberName, setFlippedMemberName] = useState<string | null>(null);

	return (
		<main className="mx-auto w-full max-w-[1500px] h-[calc(100dvh-4.5rem)] overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 xl:py-12">
			<div className="space-y-12 xl:space-y-16">

				<section className="flex flex-col items-center text-center">
					<h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl flex flex-wrap items-center justify-center gap-3">
						<span className="bg-clip-text text-transparent bg-gradient-to-r from-verdigris-400 to-[#d4a055]">
							People Behind
						</span>
						<Logo className="text-3xl sm:text-5xl lg:text-6xl" />
					</h1>
					<p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-450 sm:text-base">
						LiPy is being developed by second-year students of the 5-Year Integrated MCA Programme
						at Utkal University under the NIELIT Bhubaneswar Internship Programme.
					</p>
				</section>

				<section className="w-full">
					<div className="flex overflow-x-auto sm:overflow-visible snap-x snap-mandatory gap-6 pt-4 pb-6 w-full scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:py-4 justify-items-center xl:gap-6">
						{members.map((member) => (
							<TeamMemberCard
								key={member.name}
								member={member}
								validPhotos={validPhotos}
								isFlipped={flippedMemberName === member.name}
								onFlip={() => {
									setFlippedMemberName(flippedMemberName === member.name ? null : member.name);
								}}
							/>
						))}
					</div>
				</section>

				<section className="mt-12 pt-12 border-t border-verdigris-900/10 border-white/10 w-full">
					<div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 w-full scrollbar-none sm:grid sm:grid-cols-3 sm:pb-0 justify-items-center">
						<div className="flex flex-col items-center text-center p-4 sm:p-6 w-[70vw] max-w-[240px] sm:w-full sm:max-w-[320px] shrink-0 snap-center rounded-[16px] border border-verdigris-900/5 bg-verdigris-950/20 backdrop-blur-md shadow-sm hover:border-verdigris-500/20 transition-all duration-300">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-500/10 text-indigo-400 ring-1 ring-inset ring-verdigris-400/20">
								<GraduationCap className="h-5 w-5" />
							</div>
							<h3 className="font-display text-base font-bold text-verdigris-50">Utkal University</h3>
							<p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[220px]">Department of Computer Science & Applications</p>
						</div>

						<div className="flex flex-col items-center text-center p-4 sm:p-6 w-[70vw] max-w-[240px] sm:w-full sm:max-w-[320px] shrink-0 snap-center rounded-[16px] border border-verdigris-900/5 bg-verdigris-950/20 backdrop-blur-md shadow-sm hover:border-verdigris-500/20 transition-all duration-300">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-500/10 text-[#d4a055] ring-1 ring-inset ring-verdigris-400/20">
								<Building2 className="h-5 w-5" />
							</div>
							<h3 className="font-display text-base font-bold text-verdigris-50">NIELIT Bhubaneswar</h3>
							<p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[220px]">Academic Industry Exposure & Internship Programme</p>
						</div>

						<div className="flex flex-col items-center text-center p-4 sm:p-6 w-[70vw] max-w-[240px] sm:w-full sm:max-w-[320px] shrink-0 snap-center rounded-[16px] border border-verdigris-900/5 bg-verdigris-950/20 backdrop-blur-md shadow-sm hover:border-verdigris-500/20 transition-all duration-300">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-500/10 text-verdigris-400 ring-1 ring-inset ring-verdigris-400/20">
								<UserCheck className="h-5 w-5" />
							</div>
							<h3 className="font-display text-base font-bold text-verdigris-50">Academic Supervision</h3>
							<p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[220px]">Mentored by Bijaylaxmi Behera</p>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
