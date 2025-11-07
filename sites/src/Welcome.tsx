import { BrandGithub, BrandX } from "@mynaui/icons-react";
import { useTranslation } from "react-i18next";

import { ApplicationLogo } from "./components/ApplicationLogo";
import { LangSwitch } from "./components/LangSwitch";
import { ParticlesBackground } from "./components/ParticlesBackground";

const features = [
  {
    key: "focusSessions" as const,
    videoPath: "videos/focus.mp4",
    layout: "right" as const,
  },
  {
    key: "nestedLists" as const,
    videoPath: "videos/nested.mp4",
    layout: "left" as const,
  },
  {
    key: "easyLogging" as const,
    videoPath: "videos/logging.mp4",
    layout: "right" as const,
  },
  {
    key: "organize" as const,
    videoPath: "videos/organize.mp4",
    layout: "left" as const,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type FeatureKey = (typeof features)[number]["key"];

interface WelcomeCardProps {
  featureKey: FeatureKey;
  videoPath: string;
  layout: "left" | "right";
  translate: (key: string) => string;
}

function WelcomeCard({ featureKey, videoPath, layout, translate }: WelcomeCardProps) {
  return (
    <div
      className={cn(
        "flex gap-6 rounded-lg bg-stone-200 p-6 shadow-lg shadow-stone-300/50 transition dark:bg-stone-900/70 dark:shadow-none",
        layout === "left" ? "flex-row" : "flex-row-reverse",
      )}
    >
      <video
        className="w-1/2 rounded-lg object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={videoPath} />
      </video>
      <div className="w-1/2">
        <h3 className="mb-2 text-xl font-semibold">
          {translate(`welcome.features.${featureKey}.title`)}
        </h3>
        <p>{translate(`welcome.features.${featureKey}.description`)}</p>
      </div>
    </div>
  );
}

export function Welcome() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-stone-50 text-black/70 dark:bg-black dark:text-white/60">
      <ParticlesBackground />
      <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
        <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
          <header className="py-10">
            <nav className="-mx-3 flex justify-end">
              <div className="flex flex-row items-center gap-3">
                <a
                  className="h-10 p-2 text-black transition hover:text-black/80 dark:text-white dark:hover:text-white/80"
                  href="https://github.com/kawadumax/decopon"
                >
                  <BrandGithub className="h-6 w-6" />
                </a>
                <LangSwitch />
                <a
                  href="/guest/login"
                  className="rounded-md px-3 py-2 text-sm font-medium transition hover:text-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D20] dark:text-white"
                >
                  {t("welcome.header.login")}
                </a>
                <a
                  href="/guest/register"
                  className="rounded-md px-3 py-2 text-sm font-medium transition hover:text-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF2D20] dark:text-white"
                >
                  {t("welcome.header.register")}
                </a>
              </div>
            </nav>
          </header>

          <main className="mt-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <ApplicationLogo className="mb-4 h-64 w-64" />
                <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 transform font-cursive text-8xl font-bold text-amber-400 sm:text-9xl">
                  {t("welcome.appName")}
                </h1>
              </div>

              <div className="m-20 mb-32 max-w-2xl text-center">
                <h2 className="mb-4 text-2xl font-extrabold">
                  {t("welcome.subtitle")}
                </h2>
                <p>{t("welcome.description")}</p>
              </div>

              <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                {features.map((feature) => (
                  <WelcomeCard
                    key={feature.key}
                    featureKey={feature.key}
                    videoPath={feature.videoPath}
                    layout={feature.layout}
                    translate={t}
                  />
                ))}
              </div>

              <a
                href="/guest/register"
                className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                {t("welcome.getStarted")}
              </a>
            </div>
          </main>

          <footer className="py-16 text-center text-sm text-black dark:text-white/70">
            <div className="mb-4 flex items-center justify-center gap-4">
              <a
                href="https://x.com/kawadumax"
                className="text-black transition hover:text-black/80 dark:text-white dark:hover:text-white/80"
              >
                <BrandX className="h-6 w-6" />
              </a>
              <a
                href="https://github.com/kawadumax/decopon"
                className="text-black transition hover:text-black/80 dark:text-white dark:hover:text-white/80"
              >
                <BrandGithub className="h-6 w-6" />
              </a>
            </div>
            <small>
              This software is originally made by kawadumax. Licensed under the MPL 2.0 License.
            </small>
          </footer>
        </div>
      </div>
    </div>
  );
}
