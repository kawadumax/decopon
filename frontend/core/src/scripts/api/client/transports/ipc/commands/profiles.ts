import { endpoints } from "../../../../endpoints";
import {
  ensureRecord,
  getAuthenticatedUserId,
  getOptionalString,
  transformProfileMetaResponse,
  transformUser,
  transformVoidResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
} from "./types";

export const profileCommandDefinitions = [
  {
    method: "get",
    path: endpoints.profiles.show,
    command: "get_profile",
    buildPayload: () => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          userId,
        },
      };
    },
    transform: transformProfileMetaResponse,
  },
  {
    method: "put",
    path: endpoints.profiles.update,
    command: "update_profile",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data);
      const name = getOptionalString(payload.name);
      const email = getOptionalString(payload.email);

      return {
        command: {
          userId,
          request: {
            ...(name !== undefined ? { name } : {}),
            ...(email !== undefined ? { email } : {}),
          },
        },
      };
    },
    transform: transformUser,
  },
  {
    method: "put",
    path: endpoints.profiles.passwordUpdate,
    command: "update_profile_password",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(
        request.data,
        "current_password",
        "password",
      );

      return {
        command: {
          userId,
          request: {
            currentPassword: String(payload.current_password ?? ""),
            password: String(payload.password ?? ""),
          },
        },
      };
    },
    transform: transformVoidResponse,
  },
  {
    method: "delete",
    path: endpoints.profiles.destroy,
    command: "delete_profile",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "password");

      return {
        command: {
          userId,
          request: {
            password: String(payload.password ?? ""),
          },
        },
      };
    },
    transform: transformVoidResponse,
  },
] as const satisfies readonly IpcCommandDefinition[];

export const profileCommandMatchers = createCommandMatchers(
  profileCommandDefinitions,
);
