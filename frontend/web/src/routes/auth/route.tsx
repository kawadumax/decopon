import Authenticated from "@/layouts/AuthenticatedLayout";
import { Locale, type Preference } from "@/types/index.d";
import { Outlet, createFileRoute } from "@tanstack/react-router";

const getAuth = async () => {
	return {
		auth: {
			user: {
				id: 1,
				name: "User",
				email: "dummy@example.com",
				preference: {
					locale: Locale.ENGLISH,
					work_time: 25,
					break_time: 5,
				} as Preference,
			},
		},
	};
};

export const Route = createFileRoute("/auth")({
	beforeLoad: () => {
		return getAuth();
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<Authenticated>
			<Outlet />
		</Authenticated>
	);
}
