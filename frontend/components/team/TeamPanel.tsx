"use client";

import { TEAM_MEMBERS, type TeamMember } from "@/constants/team";
import { Github, Linkedin, Mail, GraduationCap, Building2, UserCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

function TeamMemberAvatar({ name, photoFilename, validPhotos }: { name: string; photoFilename?: string; validPhotos: string[] }) {
	const [error, setError] = useState(false);

	const isValidPhoto = photoFilename && validPhotos.includes(photoFilename);

	if (!isValidPhoto || error) {
		return (
			<div className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/5">
				<span className="text-xl font-bold tracking-tight text-slate-400 dark:text-slate-500">
					{name.charAt(0)}
				</span>
			</div>
		);
	}

	return (
		<div className="mb-5 relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-900/10 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
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

export function TeamPanel({ validPhotos = [], members = TEAM_MEMBERS }: { validPhotos?: string[], members?: TeamMember[] }) {
	return (
		<main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 xl:py-12">
			<div className="space-y-12 xl:space-y-16">

				<section className="flex flex-col items-center text-center">
					<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
						Team
					</p>
					<h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
						People Behind LiPi
					</h1>
					<p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
						LiPi is being developed by second-year students of the 5-Year Integrated MCA Programme
						at Utkal University under the NIELIT Bhubaneswar Internship Programme.
					</p>
				</section>

				<section className="w-full">
					<div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 xl:gap-6 scrollbar-none sm:overflow-visible">
						{members.map((member) => (
							<div key={member.name} className="flex flex-col h-[420px] w-[85vw] max-w-[320px] shrink-0 snap-center sm:w-full sm:max-w-none shadow-sm rounded-[10px]">
								{/* Flippable Top Section */}
								<div className="group relative z-10 flex-1" style={{ perspective: "2000px" }}>
									<div
										className="relative flex h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"
									>
										{/* Front */}
										<div
											className="absolute inset-0 flex flex-col items-center justify-start rounded-t-[10px] border border-b-0 border-slate-900/8 bg-white p-6 dark:border-white/10 dark:bg-slate-950 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
										>
											<TeamMemberAvatar name={member.name} photoFilename={member.photoFilename} validPhotos={validPhotos} />
											<div className="flex w-full flex-col items-center text-center">
												<h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
													{member.name}
												</h3>
												<p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4a055]">
													{member.role}
												</p>
												<p className="mt-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
													{member.description}
												</p>
											</div>
										</div>

										{/* Back */}
										<div
											className="absolute inset-0 flex flex-col rounded-t-[10px] border border-b-0 border-slate-900/8 bg-slate-50 p-6 dark:border-white/10 dark:bg-slate-900 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]"
										>
											<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-5 text-center dark:text-slate-400">
												Contributions
											</p>
											<div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
												<ul className="flex flex-col gap-3.5">
													{member.contributions?.map((con, idx) => (
														<li key={idx} className="flex items-start text-[13px] text-slate-700 dark:text-slate-300">
															<span className="mr-2 text-[#d4a055] opacity-80">•</span>
															<span className="leading-snug">{con}</span>
														</li>
													))}
												</ul>
											</div>
										</div>
									</div>
								</div>

								{/* Static Bottom Section container (Social Links) */}
								<div className="relative z-20 flex h-[68px] shrink-0 items-center justify-center gap-5 rounded-b-[10px] border border-t-0 border-slate-900/8 bg-white px-6 dark:border-white/10 dark:bg-slate-950">
									<div className="absolute top-0 left-4 right-4 h-px bg-slate-900/5 dark:bg-white/5" />

									{member.social?.github && (
										<a href={member.social.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
											<Github className="h-[18px] w-[18px]" />
										</a>
									)}
									{member.social?.linkedin && (
										<a href={member.social.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors">
											<Linkedin className="h-[18px] w-[18px]" />
										</a>
									)}
									{member.social?.email && (
										<a href={member.social.email} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
											<Mail className="h-[18px] w-[18px]" />
										</a>
									)}
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="mt-8 pt-10 border-t border-slate-900/10 dark:border-white/10 w-full">
					<div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-6">
						<div className="flex flex-col items-center text-center">
							<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-400/20">
								<GraduationCap className="h-6 w-6" />
							</div>
							<h3 className="font-display text-base font-bold text-slate-950 dark:text-white">Utkal University</h3>
							<p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-[200px]">Department of Computer Science & Applications</p>
						</div>

						<div className="flex flex-col items-center text-center">
							<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-400/20">
								<Building2 className="h-6 w-6" />
							</div>
							<h3 className="font-display text-base font-bold text-slate-950 dark:text-white">NIELIT Bhubaneswar</h3>
							<p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-[200px]">Academic Industry Exposure & Internship Programme</p>
						</div>

						<div className="flex flex-col items-center text-center">
							<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-400/20">
								<UserCheck className="h-6 w-6" />
							</div>
							<h3 className="font-display text-base font-bold text-slate-950 dark:text-white">Academic Supervision</h3>
							<p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-[200px]">Mentored by Bijaylaxmi Behera</p>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
