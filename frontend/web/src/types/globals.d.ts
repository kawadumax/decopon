import type { ZiggyType, ziggyRoute } from "@decopon/core";

declare global {
  // /* eslint-disable no-var */
  var route: typeof ziggyRoute;
  var Ziggy: typeof ZiggyType;
}
