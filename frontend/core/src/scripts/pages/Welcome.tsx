import ApplicationLogo from "@components/ApplicationLogo";
import { LangSwitch } from "@components/LangSwitch";
import { ParticlesBackground } from "@components/ParticlesBackground";
import { BrandGithub, BrandX } from "@mynaui/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { fetchAuth } from "../queries/auth";

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
      className={`flex rounded-lg bg-stone-200 p-6 ${variable === "left" ? "flex-row" : "flex-row-reverse"} gap-6`}
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
        <h3 className="mb-2 font-semibold text-xl">{title}</h3>
        <p className="">{description}</p>
      </div>
    </div>
  );
};

export default function Welcome() {
  const { t } = useTranslation();
  const { data: auth } = useQuery({
    queryKey: ["auth"],
    queryFn: fetchAuth,
  });

  return (
    <>
      <div className="bg-stone-50 text-black/70 dark:bg-black dark:text-white/50">
        <ParticlesBackground />
        <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
          <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
            <header className="items-center py-10">
              <nav className="-mx-3 flex justify-end">
                <div className="flex flex-row">
                  <a
                    className="h-10 p-2"
                    href="https://github.com/kawadumax/decopon"
                  >
                    <BrandGithub className="text-black dark:text-white" />
                  </a>
                  {auth?.user?.id ? (
                    <Link
                      to="/auth/dashboard"
                      className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-hidden focus-visible:ring-[#FF2D20] dark:text-white dark:focus-visible:ring-white dark:hover:text-white/80"
                    >
                      {t("header.menu.dashboard")}
                    </Link>
                  ) : (
                    <>
                      <LangSwitch />
                      <Link
                        to="/guest/login"
                        className="rounded-md px-3 py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-hidden focus-visible:ring-[#FF2D20] dark:text-white dark:focus-visible:ring-white dark:hover:text-white/80"
                      >
                        {t("header.menu.login")}
                      </Link>
                      <Link
                        to="/guest/register"
                        className="rounded-md py-2 ring-1 ring-transparent transition hover:text-black/70 focus:outline-hidden focus-visible:ring-[#FF2D20] dark:text-white dark:focus-visible:ring-white dark:hover:text-white/80"
                      >
                        {t("header.menu.register")}
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </header>

            <main className="mt-6">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <ApplicationLogo className="mb-4 h-64 w-64" />
                  <h1 className="-translate-x-1/2 -translate-y-1/3 absolute top-1/2 left-1/2 mb-4 transform font-bold font-cursive text-9xl text-amber-400">
                    {t("welcome.appName")}
                  </h1>
                </div>

                <div className="m-20 mb-32">
                  <h2 className="text-center font-extrabold text-2xl">
                    {t("welcome.subtitle")}
                  </h2>
                  <p className="max-w-2xl text-center">
                    {t("welcome.description")}
                  </p>
                </div>

                <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
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
                  to={auth?.user?.id ? "/auth/dashboard" : "/guest/register"}
                  className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-amber-500"
                >
                  {t("welcome.getStarted")}
                </Link>
              </div>
            </main>

            <footer className="py-16 text-center text-black text-sm dark:text-white/70">
              <div className="mb-2 flex items-center justify-center gap-4">
                <a href="https://x.com/kawadumax">
                  <BrandX className="h-6 w-6 text-black dark:text-white" />
                </a>
                <a href="https://github.com/kawadumax/decopon">
                  <BrandGithub className="h-6 w-6 text-black dark:text-white" />
                </a>
              </div>
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
