import { endpoints } from "../../../../endpoints";
import {
  ensureRecord,
  getAuthenticatedUserId,
  getOptionalNumber,
  transformLogListResponse,
  transformLogResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
  type RegexPathCondition,
} from "./types";

const logTaskPathCondition: RegexPathCondition<number> = {
  pattern: /^\/logs\/task\/(\d+)$/,
  map: (match) => {
    const id = Number(match[1]);
    return Number.isFinite(id) ? id : null;
  },
};

export const logCommandDefinitions = [
  {
    method: "get",
    path: endpoints.logs.index,
    command: "list_logs",
    buildPayload: () => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          userId,
        },
      };
    },
    transform: transformLogListResponse,
  },
  {
    method: "post",
    path: endpoints.logs.store,
    command: "create_log",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "content", "source");

      return {
        request: {
          userId,
          content: String(payload.content ?? ""),
          source: String(payload.source ?? ""),
          taskId: getOptionalNumber(payload.task_id),
        },
      };
    },
    transform: transformLogResponse,
  },
  {
    method: "get",
    path: logTaskPathCondition,
    command: "list_logs_by_task",
    buildPayload: (_request, taskId) => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          userId,
          taskId,
        },
      };
    },
    transform: transformLogListResponse,
  },
] as const satisfies readonly IpcCommandDefinition[];

export const logCommandMatchers = createCommandMatchers(logCommandDefinitions);
