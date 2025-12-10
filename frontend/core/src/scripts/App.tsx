import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import "nprogress/nprogress.css";
import { AppThemeProvider } from "./components/AppThemeProvider";
import { LangManager } from "./components/LangManager";
import { TimeManager } from "./components/TimeManager";
import { router } from "./lib/router";
import { queryClient } from "./queries";
import "../styles/app.css";

export const App = () => {
  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LangManager />
        <TimeManager />
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AppThemeProvider>
  );
};
