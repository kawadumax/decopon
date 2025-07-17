import { HydrateAtoms } from "@/scripts/App";
import Authenticated from "@/scripts/layouts/AuthenticatedLayout";
import { LangManager } from "@components/LangManager";
import { TimeManager } from "@components/TimeManager";
import type { Decorator } from "@storybook/react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import { queryClient } from "../../src/scripts/queries";

export const RouterDecorator: Decorator = (Story) => {
  const routeTree = createRootRoute({
    component: () => (
      <Authenticated>
        <Story />
      </Authenticated>
    ),
  });

  const router = createRouter({
    routeTree,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <HydrateAtoms>
          <LangManager />
          <TimeManager />
          <RouterProvider router={router} />
        </HydrateAtoms>
      </JotaiProvider>
    </QueryClientProvider>
  );
};
