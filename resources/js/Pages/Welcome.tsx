import ApplicationLogo from "@/Components/ApplicationLogo";
import { LangSwitch } from "@/Components/LangSwitch";
import type { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
export default function Welcome({
	auth,
	laravelVersion,
	phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
	const { t } = useTranslation();

	const WelcomeCard = ({
		title,
		description,
	}: { title: string; description: string }) => {
		return (
			<div className="bg-stone-200 p-6 rounded-lg">
				<h3 className="text-xl font-semibold mb-2">{title}</h3>
				<p className="">{description}</p>
			</div>
		);
	};

	return (
		<>
			<Head title="Welcome" />
			<div className="bg-stone-50 text-black/70 dark:bg-black dark:text-white/50">
				<div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
					<div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
						<header className="items-center py-10">
							<nav className="-mx-3 flex justify-end">
								<div className="flex flex-row">
									<LangSwitch />
								</div>

								{auth.user ? (
									<Link
										href={route("dashboard")}
										className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
									>
										{t("header.menu.dashboard")}
									</Link>
								) : (
									<>
										<Link
											href={route("login")}
											className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
										>
											{t("header.menu.login")}
										</Link>
										<Link
											href={route("register")}
											className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
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
									/>
									<WelcomeCard
										title={t("welcome.features.nestedLists.title")}
										description={t("welcome.features.nestedLists.description")}
									/>
									<WelcomeCard
										title={t("welcome.features.easyLogging.title")}
										description={t("welcome.features.easyLogging.description")}
									/>
									<WelcomeCard
										title={t("welcome.features.search.title")}
										description={t("welcome.features.search.description")}
									/>
								</div>
								<Link
									className="bg-amber-400 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-500 transition duration-300"
									href={auth.user ? route("dashboard") : route("register")}
								>
									{t("welcome.getStarted")}
								</Link>
							</div>
						</main>

						<footer className="py-16 text-center text-sm text-black dark:text-white/70">
							Laravel v{laravelVersion} (PHP v{phpVersion})
						</footer>
					</div>
				</div>
			</div>
		</>
	);
}
