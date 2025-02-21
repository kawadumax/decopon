import ApplicationLogo from "@/Components/ApplicationLogo";
import type { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
export default function Welcome({
	auth,
	laravelVersion,
	phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
	const { t } = useTranslation();
	return (
		<>
			<Head title="Welcome" />
			<div className="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50">
				<div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
					<div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
						<header className="items-center py-10">
							<nav className="-mx-3 flex justify-end">
								{auth.user ? (
									<Link
										href={route("dashboard")}
										className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
									>
										{t("header.menu.dashboard")}
									</Link>
								) : (
									<>
										<Link
											href={route("login")}
											className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
										>
											{t("header.menu.login")}
										</Link>
										<Link
											href={route("register")}
											className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
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
								<h2 className="text-2xl text-amber-300 mb-16">
									{t("welcome.subtitle")}
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
									<div className="bg-white p-6 rounded-lg shadow-md">
										<h3 className="text-xl font-semibold text-green-300 mb-2">
											{t("welcome.features.focusSessions.title")}
										</h3>
										<p className="text-amber-400">
											{t("welcome.features.focusSessions.description")}
										</p>
									</div>
									<div className="bg-white p-6 rounded-lg shadow-md">
										<h3 className="text-xl font-semibold text-green-300 mb-2">
											{t("welcome.features.nestedLists.title")}
										</h3>
										<p className="text-amber-400">
											{t("welcome.features.nestedLists.description")}
										</p>
									</div>
									<div className="bg-white p-6 rounded-lg shadow-md">
										<h3 className="text-xl font-semibold text-green-300 mb-2">
											{t("welcome.features.easyLogging.title")}
										</h3>
										<p className="text-amber-400">
											{t("welcome.features.easyLogging.description")}
										</p>
									</div>
									<div className="bg-white p-6 rounded-lg shadow-md">
										<h3 className="text-xl font-semibold text-green-300 mb-2">
											{t("welcome.features.search.title")}
										</h3>
										<p className="text-amber-400">
											{t("welcome.features.search.description")}
										</p>
									</div>
								</div>
								<p className="text-amber-400 mb-8 text-center max-w-2xl">
									{t("welcome.description")}
								</p>
								<button
									className="bg-amber-400 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-500 transition duration-300"
									type="button"
								>
									{t("welcome.getStarted")}
								</button>
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
