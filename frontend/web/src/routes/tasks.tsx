import Index from "@/pages/task/Index";
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/tasks")({
	component: Index,
	context: () => ({ title: "Tasks" }),
});
