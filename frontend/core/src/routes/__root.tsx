import type { RouterContext } from "@lib/router";
import { getLast } from "@lib/utils";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { RouteSuspenseFallback } from "@/scripts/components/RouteSuspenseFallback";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <HeadContent />
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Outlet />
      </Suspense>
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
  head: (ctx) => {
    const appName = import.meta.env.VITE_APP_NAME;
    const lastMatch = getLast(ctx.matches);
    const pageTitle = lastMatch?.context.title;
    const title = pageTitle ? `${pageTitle} | ${appName}` : appName;
    return {
      meta: [{ title }],
    };
  },
  errorComponent: () => (
    <div className="flex h-screen flex-col items-center justify-center">
      <p className="text-center font-cursive text-9xl text-fg-strong/50">
        Sorry, Some Errors Occured.
      </p>
    </div>
  ),
});
