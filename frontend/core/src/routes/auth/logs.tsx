import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { lazy } from "react";

const LogsPage = lazy(() => import("@/scripts/pages/log/Index"));

export const Route = createFileRoute("/auth/logs")({
  component: LogsPage,
  context: () => ({ title: t("log.title") }),
});
