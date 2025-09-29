import { endpoints } from "../../../../endpoints";
import {
  ensureRecord,
  transformLoginResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
} from "./types";

export const authCommandDefinitions: IpcCommandDefinition[] = [
  {
    method: "post",
    path: endpoints.auth.login,
    command: "login",
    buildPayload: (request) => {
      const payload = ensureRecord(request.data, "email", "password");

      return {
        request: {
          email: String(payload.email ?? ""),
          password: String(payload.password ?? ""),
        },
      };
    },
    transform: transformLoginResponse,
  },
  {
    method: "get",
    path: endpoints.auth.local.session,
    command: "single_user_session",
    buildPayload: () => ({}),
    transform: transformLoginResponse,
  },
];

export const authCommandMatchers = createCommandMatchers(authCommandDefinitions);
