import Index from "@/pages/log/Index";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/logs")({
	component: Index,
});
