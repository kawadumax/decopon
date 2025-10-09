import { endpoints } from "../../../../endpoints";
import { ApiError } from "../../../types";
import {
  ensureRecord,
  getAuthenticatedUserId,
  getOptionalString,
  getSearchParams,
  isFiniteNumber,
  transformCycleCountResponse,
  transformDecoponSessionListResponse,
  transformDecoponSessionResponse,
  transformDeleteDecoponSessionResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
  type RegexPathCondition,
} from "./types";

const decoponSessionPathCondition: RegexPathCondition<number> = {
  pattern: /^\/decopon_sessions\/(\d+)$/,
  map: (match) => {
    const id = Number(match[1]);
    return isFiniteNumber(id) ? id : null;
  },
};

export const decoponSessionCommandDefinitions = [
  {
    method: "get",
    path: endpoints.decoponSessions.index,
    command: "list_decopon_sessions",
    buildPayload: () => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          userId,
        },
      };
    },
    transform: transformDecoponSessionListResponse,
  },
  {
    method: "post",
    path: endpoints.decoponSessions.store,
    command: "create_decopon_session",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "status", "started_at");
      const endedAt = getOptionalString(payload.ended_at);

      return {
        request: {
          userId,
          status: String(payload.status ?? ""),
          startedAt: String(payload.started_at ?? ""),
          ...(endedAt !== undefined ? { endedAt } : {}),
        },
      };
    },
    transform: transformDecoponSessionResponse,
  },
  {
    method: "get",
    path: decoponSessionPathCondition,
    command: "get_decopon_session",
    buildPayload: (_request, sessionId) => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          id: sessionId,
          userId,
        },
      };
    },
    transform: transformDecoponSessionResponse,
  },
  {
    method: "put",
    path: decoponSessionPathCondition,
    command: "update_decopon_session",
    buildPayload: (request, sessionId) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data);
      const status = getOptionalString(payload.status);
      const endedAt = getOptionalString(payload.ended_at);

      return {
        request: {
          id: sessionId,
          userId,
          ...(status !== undefined ? { status } : {}),
          ...(endedAt !== undefined ? { endedAt } : {}),
        },
      };
    },
    transform: transformDecoponSessionResponse,
  },
  {
    method: "delete",
    path: decoponSessionPathCondition,
    command: "delete_decopon_session",
    buildPayload: (_request, sessionId) => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          id: sessionId,
          userId,
        },
      };
    },
    transform: transformDeleteDecoponSessionResponse,
  },
  {
    method: "get",
    path: endpoints.decoponSessions.cycles,
    command: "count_decopon_cycles",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const searchParams = getSearchParams(request.url);
      const date = searchParams.get("date");

      if (!date) {
        throw new ApiError("Missing required query parameter: date", {
          code: "ipc.invalidPayload",
          data: { message: "Missing required query parameter: date" },
        });
      }

      return {
        request: {
          userId,
          date,
        },
      };
    },
    transform: transformCycleCountResponse,
  },
] as const satisfies readonly IpcCommandDefinition[];

export const decoponSessionCommandMatchers = createCommandMatchers(
  decoponSessionCommandDefinitions,
);
