import { RouterProvider, createRouter } from "@tanstack/react-router";
import { DevTools } from "jotai-devtools";
import { routeTree } from "../routeTree.gen";
import { LangManager } from "./components/LangManager";
import { TimeManager } from "./components/TimeManager";
import { initializeI18n } from "./i18n";
import { Locale } from "./types/index.d";
import "jotai-devtools/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NProgress from "nprogress";
import "../css/app.css";

const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { title: "", auth: { user: undefined } },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Subscribe to events for progress bar
NProgress.configure({ showSpinner: false });
router.subscribe("onBeforeLoad", () => NProgress.start());
router.subscribe("onLoad", () => NProgress.done());

// 多言語化初期化
initializeI18n(Locale.ENGLISH);

export const App = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <LangManager />
        <TimeManager />
        <DevTools position="top-left" />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </>
  );
};
