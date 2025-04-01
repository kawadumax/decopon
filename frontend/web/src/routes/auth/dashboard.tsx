import { Dashboard } from "@/pages/Dashboard";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/auth/dashboard")({
  component: Dashboard,
  context: () => ({ title: t("dashboard.title") }),
});
