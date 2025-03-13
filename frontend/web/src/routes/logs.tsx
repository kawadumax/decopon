import Index from "@/pages/log/Index";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/logs")({
	component: Index,
	context: () => ({ title: t("log.title") }),
});
