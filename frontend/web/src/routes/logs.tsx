import Index from "@/pages/log/Index";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/logs")({
	component: Index,
	context: () => ({ title: "Logs" }),
});
