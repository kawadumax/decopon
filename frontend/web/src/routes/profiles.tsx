import Edit from "@/pages/profile/Edit";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profiles")({
	component: Edit,
	context: () => ({ title: "Profiles" }),
});
