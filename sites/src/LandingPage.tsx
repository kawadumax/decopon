import { BrandGithub, BrandX } from "@mynaui/icons-react";
import { useTranslation } from "react-i18next";

import { ApplicationLogo } from "./components/ApplicationLogo";
import { FeatureCard, type FeatureLayout } from "./components/FeatureCard";
import { LangSwitch } from "./components/LangSwitch";
import { ParticlesBackground } from "./components/ParticlesBackground";

const basePath = (() => {
  const rawBase = import.meta.env.BASE_URL ?? "/";
  if (rawBase === "/") {
    return "";
  }
  return rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
})();

const withBasePath = (target: string) => {
  const normalized = target.startsWith("/") ? target : `/${target}`;
  return `${basePath}${normalized}`;
};

const featureDefinitions = [
  {
    key: "focusSessions" as const,
    videoSrc: withBasePath("videos/focus.mp4"),
    fallbackImageSrc: withBasePath("videos/focus.gif"),
    layout: "right" as FeatureLayout,
  },
  {
    key: "nestedLists" as const,
    videoSrc: withBasePath("videos/nested.mp4"),
    fallbackImageSrc: withBasePath("videos/nested.gif"),
    layout: "left" as FeatureLayout,
  },
  {
    key: "easyLogging" as const,
    videoSrc: withBasePath("videos/logging.mp4"),
    fallbackImageSrc: withBasePath("videos/logging.gif"),
    layout: "right" as FeatureLayout,
  },
  {
    key: "organize" as const,
    videoSrc: withBasePath("videos/organize.mp4"),
    fallbackImageSrc: withBasePath("videos/organize.gif"),
    layout: "left" as FeatureLayout,
  },
] as const;

type FeatureDefinition = (typeof featureDefinitions)[number];

export function LandingPage() {
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
                {featureDefinitions.map((feature: FeatureDefinition) => (
                  <FeatureCard
                    key={feature.key}
                    title={t(`welcome.features.${feature.key}.title`)}
                    description={t(`welcome.features.${feature.key}.description`)}
                    videoSrc={feature.videoSrc}
                    fallbackImageSrc={feature.fallbackImageSrc}
                    layout={feature.layout}
                  />
                ))}
              </div>
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

export default LandingPage;
