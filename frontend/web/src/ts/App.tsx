import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { LangManager } from "./components/LangManager";
import { TimeManager } from "./components/TimeManager";
import { router } from "./lib/router";
import "../css/app.css";
import { Provider as JotaiProvider } from "jotai";
import { DevTools as JotaiDevTools } from "jotai-devtools";
import { queryClientAtom } from "jotai-tanstack-query";
import { useHydrateAtoms } from "jotai/utils";
import type React from "react";
import { queryClient } from "./lib/queryClient";

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
