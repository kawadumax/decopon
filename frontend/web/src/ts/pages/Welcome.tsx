import ApplicationLogo from "@/components/ApplicationLogo";
import { LangSwitch } from "@/components/LangSwitch";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import type { PageProps } from "@/types";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const WelcomeCard = ({
	variable = "right",
	title,
	description,
	videoPath,
}: {
	variable?: "left" | "right";
	title: string;
	description: string;
	videoPath: string;
}) => {
	return (
		<div
			className={`bg-stone-200 p-6 rounded-lg flex ${variable === "left" ? "flex-row" : "flex-row-reverse"} gap-6`}
		>
			<video
				className="w-1/2 rounded-lg object-cover"
				autoPlay
				muted
				loop={true}
			>
				<source src={videoPath} />
			</video>
			<div className="w-1/2">
				<h3 className="text-xl font-semibold mb-2">{title}</h3>
				<p className="">{description}</p>
			</div>
		</div>
	);
};

export default function Welcome({ auth }: PageProps) {
	const { t } = useTranslation();
	return (
		<>
			{/* <Head title="Welcome" /> */}
			<div className="bg-stone-50 text-black/70 dark:bg-black dark:text-white/50">
				<ParticlesBackground />
				<div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
					<div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
						<header className="items-center py-10">
							<nav className="-mx-3 flex justify-end">
								<div className="flex flex-row">
									<LangSwitch />
								</div>

								{auth.user ? (
									<Link
										to="/dashboard"
										className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
									>
										{t("header.menu.dashboard")}
									</Link>
								) : (
									<>
										<Link
											to="/login"
											className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
										>
											{t("header.menu.login")}
										</Link>
										<Link
											to="/register"
											className="rounded-md py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
										>
											{t("header.menu.register")}
										</Link>
									</>
								)}
							</nav>
						</header>

						<main className="mt-6">
							<div className="flex flex-col items-center justify-center">
								<div className="relative">
									<ApplicationLogo className="w-64 h-64 mb-4" />
									<h1 className="text-9xl font-bold text-amber-400 mb-4 font-cursive absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3">
										{t("welcome.title")}
									</h1>
								</div>

								<div className="m-20 mb-32">
									<h2 className="text-2xl text-center font-extrabold">
										{t("welcome.subtitle")}
									</h2>
									<p className="text-center max-w-2xl">
										{t("welcome.description")}
									</p>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
									<WelcomeCard
										title={t("welcome.features.focusSessions.title")}
										description={t(
											"welcome.features.focusSessions.description",
										)}
										videoPath="videos/focus.mp4"
									/>
									<WelcomeCard
										title={t("welcome.features.nestedLists.title")}
										description={t("welcome.features.nestedLists.description")}
										variable="left"
										videoPath="videos/nested.mp4"
									/>
									<WelcomeCard
										title={t("welcome.features.easyLogging.title")}
										description={t("welcome.features.easyLogging.description")}
										videoPath="videos/logging.mp4"
									/>
									<WelcomeCard
										title={t("welcome.features.organize.title")}
										description={t("welcome.features.organize.description")}
										variable="left"
										videoPath="videos/organize.mp4"
									/>
								</div>

								<Link
									to={auth.user ? "/dashboard" : "/register"}
									className="bg-amber-400 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-500 transition duration-300"
								>
									{t("welcome.getStarted")}
								</Link>
							</div>
						</main>

						<footer className="py-16 text-center text-sm text-black dark:text-white/70">
							<small>
								This software is originally made by kawadumax. Licensed under
								the MPL 2.0 License.
							</small>
						</footer>
					</div>
				</div>
			</div>
		</>
	);
}
