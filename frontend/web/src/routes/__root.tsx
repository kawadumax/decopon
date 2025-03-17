import { getLast } from "@/lib/utils";
import type { User } from "@/types";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";

interface RouterContext {
  title: string;
  auth: {
    user?: User;
  };
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
