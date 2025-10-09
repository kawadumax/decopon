import { endpoints } from "../../../../endpoints";
import {
  ensureNumber,
  ensureRecord,
  getAuthenticatedUserId,
  transformPreferenceResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
} from "./types";

export const preferenceCommandDefinitions = [
  {
    method: "put",
    path: endpoints.preferences.update,
    command: "update_preferences",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(
        request.data,
        "work_time",
        "break_time",
        "locale",
      );

      return {
        command: {
          userId,
          request: {
            workTime: ensureNumber(payload.work_time, "preference.work_time"),
            breakTime: ensureNumber(payload.break_time, "preference.break_time"),
            locale: String(payload.locale ?? ""),
          },
        },
      };
    },
    transform: transformPreferenceResponse,
  },
] as const satisfies readonly IpcCommandDefinition[];

export const preferenceCommandMatchers = createCommandMatchers(
  preferenceCommandDefinitions,
);
