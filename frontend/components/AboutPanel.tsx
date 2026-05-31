"use client";

const STATS = [
	{ label: "Character Classes", value: "43" },
	{ label: "Dataset Samples", value: "1370+" },
	{ label: "Recognition Model", value: "CNN" },
	{ label: "Project Type", value: "Internship Project" },
];

const CHALLENGES = [
	{
		title: "Handwriting Variability",
		description:
			"Different writers produce the same Odia character using different stroke styles, proportions, and writing habits.",
	},
	{
		title: "Limited Public Datasets",
		description:
			"Handwritten Odia OCR research faces challenges due to the limited availability of large, structured datasets.",
	},
	{
		title: "Character Similarity",
		description:
			"Several Odia characters contain visually similar structures, making accurate classification difficult.",
	},
];

const STACK = [
	{
		title: "Frontend",
		value: "Next.js + Tailwind CSS",
	},
	{
		title: "Backend",
		value: "FastAPI",
	},
	{
		title: "Machine Learning",
		value: "TensorFlow / Keras",
	},
	{
		title: "Deployment",
		value: "Vercel",
	},
];

const STATUS = [
	{
		title: "Dataset Collection",
		value: "Active",
	},
	{
		title: "Model Training",
		value: "Active",
	},
	{
		title: "OCR Interface",
		value: "Operational",
	},
	{
		title: "LiPiD Platform",
		value: "Operational",
	},
];

const FUTURE_WORK = [
	"Expand dataset coverage",
	"Improve recognition accuracy",
	"Support additional Odia characters",
	"Real-time camera recognition",
	"Sentence-level OCR research",
	"Mobile optimization",
	"Dataset validation workflow",
	"Contributor management tools",
];

export function AboutPanel() {
	return (
		<main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
			<div className="space-y-8">

				{/* HERO */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
						About
					</p>

					<h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
						LiPi: Odia Handwriting Recognition System
					</h1>

					<p className="mt-5 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is an academic machine learning project developed by second-year students of the
						5-Year Integrated MCA programme at Utkal University, Bhubaneswar, under the NIELIT
						Bhubaneswar Internship Programme.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The project focuses on handwritten Odia character recognition through custom dataset
						development, deep learning based classification, and an interactive OCR platform for
						real-time prediction and experimentation.
					</p>

					<div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						{STATS.map((item) => (
							<div
								key={item.label}
								className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
							>
								<p className="text-2xl font-bold text-slate-950 dark:text-white">
									{item.value}
								</p>

								<p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
									{item.label}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* PROJECT BACKGROUND */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Project Background
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						Handwritten character recognition remains a challenging problem due to differences in
						writing styles, stroke variations, and the availability of language-specific datasets.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						While OCR technologies are widely available for several major languages, resources for
						handwritten Odia script recognition remain comparatively limited. LiPi was created to
						explore practical machine learning solutions for handwritten Odia character recognition
						while contributing toward language technology research and dataset development.
					</p>
				</section>

				{/* ACADEMIC CONTEXT */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Academic Context
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is being developed as part of the NIELIT Bhubaneswar Internship Programme under
						the guidance of Bijaylaxmi Behera.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The project is being carried out by students of the 5-Year Integrated MCA programme
						under the Department of Computer Science & Applications, Utkal University,
						Bhubaneswar.
					</p>
				</section>

				{/* PROJECT GOALS */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Project Goals
					</h2>

					<div className="mt-6 grid gap-3 md:grid-cols-2">
						{[
							"Build a handwritten Odia character dataset",
							"Develop a machine learning model for character classification",
							"Create a real-time OCR interface for prediction",
							"Design a contributor platform for dataset growth",
							"Explore AI applications in regional language computing",
							"Support future language technology research",
						].map((goal) => (
							<div
								key={goal}
								className="flex items-center gap-3 rounded-xl border border-slate-900/8 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
							>
								<span>•</span>
								<span>{goal}</span>
							</div>
						))}
					</div>
				</section>

				{/* CHALLENGES */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						The Challenge
					</h2>

					<div className="mt-6 grid gap-4 lg:grid-cols-3">
						{CHALLENGES.map((item) => (
							<div
								key={item.title}
								className="rounded-xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
							>
								<h3 className="font-semibold text-slate-950 dark:text-white">
									{item.title}
								</h3>

								<p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
									{item.description}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* ECOSYSTEM */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						The LiPi Ecosystem
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is not only an OCR model. The project combines dataset collection,
						preprocessing, model training, and inference into a unified workflow.
					</p>

					<div className="mt-8 flex flex-col items-center gap-3 text-center lg:flex-row lg:justify-between">
						{[
							"LiPiD Dataset Collection",
							"Dataset Preparation",
							"Image Processing",
							"CNN Training",
							"OCR Recognition",
							"Prediction Results",
						].map((step, index) => (
							<div key={step} className="flex items-center gap-3">
								<div className="rounded-xl border border-slate-900/8 bg-white/70 px-4 py-3 text-sm font-medium dark:border-white/10 dark:bg-white/5">
									{step}
								</div>

								{index < 5 ? (
									<span className="hidden text-slate-400 lg:block">→</span>
								) : null}
							</div>
						))}
					</div>
				</section>

				{/* DATASET */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Dataset Development
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						A custom handwritten Odia character dataset is being developed through LiPiD, a
						dedicated contributor platform created alongside the OCR system.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						Contributors submit isolated handwritten characters which are reviewed, labeled,
						processed, and used for model training and evaluation.
					</p>

					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Character Classes</p>
							<p className="mt-1 text-xl font-bold">43</p>
						</div>

						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Dataset Samples</p>
							<p className="mt-1 text-xl font-bold">1370+</p>
						</div>

						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Image Resolution</p>
							<p className="mt-1 text-xl font-bold">64 × 64</p>
						</div>

						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Dataset Status</p>
							<p className="mt-1 text-xl font-bold">Growing</p>
						</div>
					</div>
				</section>

				{/* MODEL */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Recognition Model
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The recognition engine is based on a Convolutional Neural Network trained on
						handwritten Odia character samples.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The model learns visual stroke patterns from labeled data and predicts the most
						probable character class from user input.
					</p>

					<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Input Size</p>
							<p className="mt-1 font-semibold">64 × 64</p>
						</div>

						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Framework</p>
							<p className="mt-1 font-semibold">TensorFlow</p>
						</div>

						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Task</p>
							<p className="mt-1 font-semibold">Multi-Class Classification</p>
						</div>

						<div className="rounded-xl border border-slate-900/8 p-4 dark:border-white/10">
							<p className="text-sm text-slate-500">Output</p>
							<p className="mt-1 font-semibold">Top Predictions</p>
						</div>
					</div>
				</section>

				{/* TECH STACK */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Technology Stack
					</h2>

					<div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{STACK.map((item) => (
							<div
								key={item.title}
								className="rounded-xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
							>
								<p className="text-sm text-slate-500">
									{item.title}
								</p>

								<p className="mt-2 font-semibold text-slate-950 dark:text-white">
									{item.value}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* STATUS */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Current Development Status
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is currently under active development. Dataset collection, model training,
						evaluation, and interface improvements continue as new handwritten samples are added
						to the system.
					</p>

					<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{STATUS.map((item) => (
							<div
								key={item.title}
								className="rounded-xl border border-slate-900/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
							>
								<p className="text-sm text-slate-500">
									{item.title}
								</p>

								<p className="mt-2 font-semibold text-emerald-600 dark:text-emerald-400">
									{item.value}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* FUTURE */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Future Scope
					</h2>

					<div className="mt-6 grid gap-3 sm:grid-cols-2">
						{FUTURE_WORK.map((item) => (
							<div
								key={item}
								className="flex items-center gap-3 rounded-xl border border-slate-900/8 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
							>
								<span>✓</span>
								<span>{item}</span>
							</div>
						))}
					</div>
				</section>

				{/* ACKNOWLEDGEMENT */}

				<section className="panel rounded-2xl p-6 sm:p-8">
					<h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
						Acknowledgement
					</h2>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						LiPi is being developed under the NIELIT Bhubaneswar Internship Programme under the
						guidance of Bijaylaxmi Behera.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						The project is being carried out by students of the Integrated MCA programme at
						Utkal University, Bhubaneswar.
					</p>

					<p className="mt-4 max-w-5xl text-base leading-8 text-slate-600 dark:text-slate-300">
						Special thanks to faculty mentors, contributors, and volunteers supporting dataset
						development, testing, and evaluation.
					</p>
				</section>

			</div>
		</main>
	);
}