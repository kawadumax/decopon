import Index from "@/pages/tag/Index";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/tags")({
	component: Index,
});
