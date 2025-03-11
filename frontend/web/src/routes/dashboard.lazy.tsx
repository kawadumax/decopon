import { Dashboard } from "@/pages/Dashboard";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard")({
	component: () => <Dashboard />,
});
