import Edit from "@/pages/profile/Edit";
import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/auth/profiles")({
	component: Edit,
	context: () => ({ title: t("profile.title") }),
});
