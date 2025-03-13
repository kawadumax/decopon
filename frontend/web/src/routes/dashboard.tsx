import { Dashboard } from "@/pages/Dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
	component: Dashboard,
	context: () => ({ title: "Dashboard" }),
});
