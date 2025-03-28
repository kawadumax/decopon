import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";
import { LangManager } from "./components/LangManager";
import { TimeManager } from "./components/TimeManager";
import { initializeI18n } from "./i18n";
import { Locale } from "./types/index.d";
import "../css/app.css";
import { Provider as JotaiProvider } from "jotai";
import { DevTools as JotaiDevTools } from "jotai-devtools";
import { queryClientAtom } from "jotai-tanstack-query";
import { useHydrateAtoms } from "jotai/utils";
import type React from "react";
import { NProgressManager } from "./lib/nProgressManager";
import { queryClient } from "./lib/queryClient";

export interface RouterContext {
  title: string;
}

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { title: "" } as RouterContext,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const progressManager = NProgressManager.getInstance();
router.subscribe("onBeforeNavigate", () => {
  progressManager.incrementRequests();
});
router.subscribe("onResolved", () => {
  progressManager.decrementRequests();
});

// 多言語化初期化
initializeI18n(Locale.ENGLISH);

const HydrateAtoms: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
};

export const App = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <HydrateAtoms>
            <LangManager />
            <TimeManager />
            <RouterProvider router={router} />
            <JotaiDevTools position="bottom-left" />
            <ReactQueryDevtools initialIsOpen={false} />
          </HydrateAtoms>
        </JotaiProvider>
      </QueryClientProvider>
    </>
  );
};
