import Register from "@/pages/auth/Register";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
	component: Register,
	context: () => ({ title: "Register" }),
});
