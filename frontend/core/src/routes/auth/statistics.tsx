import { Statistics } from "@/scripts/pages/Statistics";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/auth/statistics")({
  component: Statistics,
  context: () => ({ title: t("statistics.title") }),
});
