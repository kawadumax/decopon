import type { RouterContext } from "@lib/router";
import { getLast } from "@lib/utils";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";

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
  errorComponent: () => (
    <div className="flex h-screen flex-col items-center justify-center">
      <p className="text-center font-cursive text-9xl text-black/50">
        Sorry, Some Errors Occured.
      </p>
    </div>
  ),
});
