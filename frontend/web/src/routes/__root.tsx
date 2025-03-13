import { getLast } from "@/lib/utils";
import {
	HeadContent,
	Outlet,
	createRootRouteWithContext,
} from "@tanstack/react-router";

interface RouterContext {
	title: string;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => (
		<>
			<HeadContent />
			<Outlet />
			{/* <TanStackRouterDevtools /> */}
		</>
	),
	head: (ctx) => {
		const pageTitle = getLast(ctx.matches).context.title;
		const appName = import.meta.env.VITE_APP_NAME;
		return {
			meta: [{ title: `${pageTitle} | ${appName}` }],
		};
	},
});
