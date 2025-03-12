import Register from "@/pages/auth/Register";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/register")({
	component: Register,
});
