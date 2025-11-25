import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import "nprogress/nprogress.css";
import { LangManager } from "./components/LangManager";
import { TimeManager } from "./components/TimeManager";
import { router } from "./lib/router";
import { queryClient } from "./queries";
import "../styles/app.css";

export const App = () => {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey="decopon-theme"
      >
        <QueryClientProvider client={queryClient}>
          <LangManager />
          <TimeManager />
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
};
