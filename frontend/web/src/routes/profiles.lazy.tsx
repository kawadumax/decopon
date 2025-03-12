import Edit from "@/pages/profile/Edit";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/profiles")({
	component: Edit,
});
