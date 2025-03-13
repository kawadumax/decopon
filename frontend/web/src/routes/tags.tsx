import Index from "@/pages/tag/Index";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tags")({
	component: Index,
	context: () => ({ title: "Tags" }),
});
