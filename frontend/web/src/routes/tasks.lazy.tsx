import Index from "@/pages/task/Index";
import { createLazyFileRoute } from "@tanstack/react-router";
export const Route = createLazyFileRoute("/tasks")({
	component: Index,
});
