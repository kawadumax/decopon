import Login from "@/pages/auth/Login";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/login")({
	component: Login,
});
