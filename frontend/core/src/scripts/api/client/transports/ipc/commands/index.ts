import { authCommandDefinitions } from "./auth";
import { decoponSessionCommandDefinitions } from "./decoponSessions";
import { logCommandDefinitions } from "./logs";
import { preferenceCommandDefinitions } from "./preferences";
import { profileCommandDefinitions } from "./profiles";
import { tagCommandDefinitions } from "./tags";
import { taskCommandDefinitions } from "./tasks";
import { createCommandMatchers } from "./types";

export { authCommandDefinitions, authCommandMatchers } from "./auth";
export {
  decoponSessionCommandDefinitions,
  decoponSessionCommandMatchers,
} from "./decoponSessions";
export { logCommandDefinitions, logCommandMatchers } from "./logs";
export {
  preferenceCommandDefinitions,
  preferenceCommandMatchers,
} from "./preferences";
export { profileCommandDefinitions, profileCommandMatchers } from "./profiles";
export { tagCommandDefinitions, tagCommandMatchers } from "./tags";
export { taskCommandDefinitions, taskCommandMatchers } from "./tasks";

export const ipcCommandDefinitions = [
  ...authCommandDefinitions,
  ...tagCommandDefinitions,
  ...logCommandDefinitions,
  ...decoponSessionCommandDefinitions,
  ...profileCommandDefinitions,
  ...preferenceCommandDefinitions,
  ...taskCommandDefinitions,
] as const;

export const ipcCommandMatchers = createCommandMatchers(ipcCommandDefinitions);
