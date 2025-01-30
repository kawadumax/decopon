import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const handleImageError = () => {
        document
            .getElementById("screenshot-container")
            ?.classList.add("!hidden");
        document.getElementById("docs-card")?.classList.add("!row-span-1");
        document
            .getElementById("docs-card-content")
            ?.classList.add("!flex-row");
        document.getElementById("background")?.classList.add("!hidden");
    };

    return (
        <>
            <Head title="Welcome"></Head>
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
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route("login")}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route("register")}
                                            className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                        >
                                            Register
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
                                        Decopon
                                    </h1>
                                </div>
                                <h2 className="text-2xl text-amber-300 mb-16">
                                    The Task Manager for ADHD
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                                    <div className="bg-white p-6 rounded-lg shadow-md">
                                        <h3 className="text-xl font-semibold text-green-300 mb-2">
                                            Focus Sessions
                                        </h3>
                                        <p className="text-amber-400">
                                            Pomodoro technique to boost
                                            productivity
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-md">
                                        <h3 className="text-xl font-semibold text-green-300 mb-2">
                                            Nested Lists
                                        </h3>
                                        <p className="text-amber-400">
                                            Organize tasks with ease
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-md">
                                        <h3 className="text-xl font-semibold text-green-300 mb-2">
                                            Easy Logging
                                        </h3>
                                        <p className="text-amber-400">
                                            Tag tasks for simple categorization
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-md">
                                        <h3 className="text-xl font-semibold text-green-300 mb-2">
                                            Search
                                        </h3>
                                        <p className="text-amber-400">
                                            Find tasks quickly with keywords or
                                            tags
                                        </p>
                                    </div>
                                </div>
                                <p className="text-amber-400 mb-8 text-center max-w-2xl">
                                    Decopon helps you break down complex tasks
                                    into smaller, more manageable chunks, just
                                    like the juicy segments of a Dekopon fruit.
                                </p>
                                <button className="bg-amber-400 text-white px-6 py-3 rounded-full font-semibold hover:bg-amber-500 transition duration-300">
                                    Get Started
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
