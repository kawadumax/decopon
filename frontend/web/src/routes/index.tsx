import Welcome from "@/pages/Welcome";
import type { User } from "@/types/index.d";
import { createFileRoute } from "@tanstack/react-router";

// dummy auth object
const auth = {
	user: {
		id: 1,
		name: "test",
		email: "user@example.com",
	} as User,
	preference: {
		locale: "en",
	},
};

export const Route = createFileRoute("/")({
	component: () => <Welcome auth={auth} />,
	context: () => ({ title: "Welcome" }),
});
