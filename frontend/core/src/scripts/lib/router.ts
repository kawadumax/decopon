import { createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import { NProgressManager } from "./nProgressManager";

export interface RouterContext {
  title: string;
}

// Create a new router instance
export const router = createRouter({
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
