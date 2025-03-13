import Login from "@/pages/auth/Login";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: Login,
	context: () => ({ title: "Login" }),
});
