import Welcome from "@/pages/Welcome";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
	component: () => <Welcome />,
});
