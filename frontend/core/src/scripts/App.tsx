import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import { DevTools } from "jotai-devtools";
import { queryClientAtom } from "jotai-tanstack-query";
import { useHydrateAtoms } from "jotai/utils";
import type React from "react";
import { LangManager } from "./components/LangManager";
import { TimeManager } from "./components/TimeManager";
import { router } from "./lib/router";
import { queryClient } from "./queries";
import "../styles/app.css";

export const HydrateAtoms: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useHydrateAtoms([[queryClientAtom, queryClient]]);
  return children;
};

const JotaiDevTools = () => {
  if (import.meta.env.MODE !== "production") {
    import("jotai-devtools/styles.css");
    return <DevTools position={"bottom-left"} />;
  }
  return null;
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
            <JotaiDevTools />
            <ReactQueryDevtools initialIsOpen={false} />
          </HydrateAtoms>
        </JotaiProvider>
      </QueryClientProvider>
    </>
  );
};
