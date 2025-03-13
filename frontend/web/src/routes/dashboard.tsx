import { Dashboard } from "@/pages/Dashboard";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { t } from "i18next";

export const Route = createFileRoute("/dashboard")({
	loader: ({ context }) => {
		// ユーザー情報がない場合はログインページにリダイレクト
		if (!context.auth.user) {
			return redirect({ to: "/login" });
		}
	},
	component: Dashboard,
	context: () => ({ title: t("dashboard.title") }),
});
