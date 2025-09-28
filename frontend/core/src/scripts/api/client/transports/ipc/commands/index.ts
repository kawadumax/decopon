import { authCommandMatchers } from "./auth";
import { taskCommandMatchers } from "./tasks";
import type { IpcCommandMatcher } from "./types";

export const ipcCommandMatchers: IpcCommandMatcher[] = [
  ...authCommandMatchers,
  ...taskCommandMatchers,
];
