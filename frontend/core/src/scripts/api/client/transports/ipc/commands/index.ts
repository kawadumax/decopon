import { authCommandDefinitions } from "./auth";
import { taskCommandDefinitions } from "./tasks";
import { createCommandMatchers } from "./types";

export { authCommandDefinitions, authCommandMatchers } from "./auth";
export { taskCommandDefinitions, taskCommandMatchers } from "./tasks";

export const ipcCommandDefinitions = [
  ...authCommandDefinitions,
  ...taskCommandDefinitions,
] as const;

export const ipcCommandMatchers = createCommandMatchers(ipcCommandDefinitions);
