import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const StatisticsPage = lazy(() => import("@/scripts/pages/statistics/Index"));

export const Route = createFileRoute("/auth/statistics")({
  component: StatisticsPage,
  context: () => ({ title: t("statistics.title") }),
});
