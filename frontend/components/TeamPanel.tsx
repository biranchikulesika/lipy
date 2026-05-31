"use client";

const TEAM_MEMBERS = [
	{
		name: "Gundala Anushka",
		role: "Project Lead",
		description:
			"Coordinated project activities, communicated with mentors, managed progress tracking, reviewed implementation work, and led project presentations.",
	},
	{
		name: "Biranchi Kulesika",
		role: "Technical Lead",
		description:
			"Developed the LiPiD dataset contributor platform, trained the LiPi CNN model, built the OCR application, designed the system architecture, and managed deployment workflows.",
	},
	{
		name: "Baibhab Sahu",
		role: "Dataset & Documentation Team",
		description:
			"Contributed to project documentation, dataset verification, manual review of collected samples, and filtering of invalid character submissions.",
	},
	{
		name: "Soumyasmita Mohapatra",
		role: "Dataset & Documentation Team",
		description:
			"Contributed to documentation, dataset validation, quality checking, and manual filtering of collected handwritten samples.",
	},
	{
		name: "Prajna Dash",
		role: "Dataset & Documentation Team",
		description:
			"Contributed to dataset review, sample verification, documentation support, and removal of incorrectly labeled or invalid submissions.",
	},
];

const CONTRIBUTIONS = [
	{
		title: "Project Coordination",
		lead: "Gundala Anushka",
		items: [
			"Project planning",
			"Progress tracking",
			"Mentor communication",
			"Presentation preparation",
			"Code review",
		],
	},
	{
		title: "Platform Development",
		lead: "Biranchi Kulesika",
		items: [
			"LiPi OCR application",
			"LiPiD contributor platform",
			"Frontend development",
			"Deployment workflow",
		],
	},
	{
		title: "Machine Learning",
		lead: "Biranchi Kulesika",
		items: [
			"CNN model development",
			"Training pipeline",
			"Image preprocessing",
			"Model evaluation",
		],
	},
	{
		title: "Dataset Development",
		lead: "Baibhab Sahu, Soumyasmita Mohapatra & Prajna Dash",
		items: [
			"Dataset validation",
			"Sample verification",
			"Manual data filtering",
			"Documentation",
		],
	},
];

export function TeamPanel() {
	return (
		<main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
			<div className="space-y-8">

				{/* HERO */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
						Team
					</p>

					<h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
						People Behind LiPi
					</h1>

					<p className="mt-5 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is being developed by second-year students of the 5-Year Integrated MCA Programme
						at Utkal University under the NIELIT Bhubaneswar Internship Programme.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The project combines machine learning, software development, dataset creation, and
						research efforts to build an end-to-end Odia Handwriting Recognition system.
					</p>
				</section>

				{/* MENTOR */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Academic Supervision
					</h2>

					<div className="mt-6 rounded-2xl border border-slate-900/8 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
							Faculty Mentor
						</p>

						<h3 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
							Bijaylaxmi Behera
						</h3>

						<p className="mt-2 text-base text-slate-600 dark:text-slate-300">
							NIELIT Bhubaneswar
						</p>

						<p className="mt-4 max-w-4xl leading-7 text-slate-600 dark:text-slate-300">
							Provided academic guidance, project direction, technical review, and mentorship
							throughout the development of LiPi.
						</p>
					</div>
				</section>

				{/* LEADERSHIP */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Leadership
					</h2>

					<div className="mt-6 grid gap-4 lg:grid-cols-2">
						<div className="rounded-2xl border border-slate-900/8 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
							<h3 className="text-xl font-bold text-slate-950 dark:text-white">
								Gundala Anushka
							</h3>

							<p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
								Project Lead
							</p>

							<p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
								Coordinated project activities, communicated with mentors, managed progress
								tracking, reviewed implementation work, and led project presentations.
							</p>
						</div>

						<div className="rounded-2xl border border-slate-900/8 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
							<h3 className="text-xl font-bold text-slate-950 dark:text-white">
								Biranchi Kulesika
							</h3>

							<p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
								Technical Lead
							</p>

							<p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
								Developed the LiPiD dataset contributor platform, trained the LiPi CNN model,
								built the OCR application, designed the system architecture, and managed
								deployment workflows.
							</p>
						</div>
					</div>
				</section>

				{/* TEAM MEMBERS */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Project Team
					</h2>

					<div className="mt-6 grid gap-4 lg:grid-cols-3">
						{TEAM_MEMBERS.slice(2).map((member) => (
							<div
								key={member.name}
								className="rounded-2xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
							>
								<h3 className="font-semibold text-slate-950 dark:text-white">
									{member.name}
								</h3>

								<p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
									{member.role}
								</p>

								<p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
									{member.description}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* CONTRIBUTIONS */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Contribution Areas
					</h2>

					<div className="mt-6 grid gap-4 lg:grid-cols-2">
						{CONTRIBUTIONS.map((area) => (
							<div
								key={area.title}
								className="rounded-2xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
							>
								<h3 className="font-semibold text-slate-950 dark:text-white">
									{area.title}
								</h3>

								<p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
									Lead: {area.lead}
								</p>

								<ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
									{area.items.map((item) => (
										<li key={item}>• {item}</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</section>

				{/* INSTITUTION */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Institutional Affiliation
					</h2>

					<div className="mt-6 grid gap-4 lg:grid-cols-2">
						<div className="rounded-2xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
							<h3 className="font-semibold text-slate-950 dark:text-white">
								Utkal University
							</h3>

							<p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
								Department of Computer Science & Applications
							</p>

							<p className="text-slate-600 dark:text-slate-300">
								Bhubaneswar, Odisha
							</p>
						</div>

						<div className="rounded-2xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
							<h3 className="font-semibold text-slate-950 dark:text-white">
								NIELIT Bhubaneswar
							</h3>

							<p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
								Internship Programme
							</p>

							<p className="text-slate-600 dark:text-slate-300">
								Academic Industry Exposure Initiative
							</p>
						</div>
					</div>
				</section>

				{/* ACKNOWLEDGEMENT */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Acknowledgement
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is being developed under the NIELIT Bhubaneswar Internship Programme with
						guidance from Bijaylaxmi Behera.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The project reflects the collaborative efforts of students from the Integrated MCA
						programme at Utkal University who contributed to dataset creation, machine learning
						development, software engineering, testing, and documentation.
					</p>
				</section>

			</div>
		</main>
	);
}