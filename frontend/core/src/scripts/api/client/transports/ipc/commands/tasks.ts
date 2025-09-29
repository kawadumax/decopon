import { endpoints } from "../../../../endpoints";
import {
  ensureRecord,
  getAuthenticatedUserId,
  getOptionalBoolean,
  getOptionalNumber,
  getOptionalNumberArray,
  getOptionalString,
  getSearchParams,
  isFiniteNumber,
  transformDeleteTaskResponse,
  transformTaskListResponse,
  transformTaskResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
  type RegexPathCondition,
} from "./types";

const taskIdPathCondition: RegexPathCondition<number> = {
  pattern: /^\/tasks\/(\d+)$/,
  map: (match) => {
    const id = Number(match[1]);
    return isFiniteNumber(id) ? id : null;
  },
};

export const taskCommandDefinitions = [
  {
    method: "get",
    path: endpoints.tasks.index,
    command: "list_tasks",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const searchParams = getSearchParams(request.url);
      const tagIds = searchParams
        .getAll("tag_ids")
        .map(Number)
        .filter(isFiniteNumber);

      return {
        request: {
          userId,
          ...(tagIds.length > 0 ? { tagIds } : {}),
        },
      };
    },
    transform: transformTaskListResponse,
  } satisfies IpcCommandDefinition,
  {
    method: "post",
    path: endpoints.tasks.store,
    command: "create_task",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data);

      return {
        request: {
          userId,
          title: String(payload.title ?? ""),
          description: getOptionalString(payload.description),
          parentTaskId: getOptionalNumber(payload.parent_task_id),
          tagIds: getOptionalNumberArray(payload.tag_ids),
        },
      };
    },
    transform: transformTaskResponse,
  } satisfies IpcCommandDefinition,
  {
    method: "put",
    path: taskIdPathCondition,
    command: "update_task",
    buildPayload: (request, taskId) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data);

      return {
        request: {
          id: taskId,
          userId,
          title: getOptionalString(payload.title),
          description: getOptionalString(payload.description),
          completed: getOptionalBoolean(payload.completed),
          parentTaskId: getOptionalNumber(payload.parent_task_id),
          tagIds: getOptionalNumberArray(payload.tag_ids),
        },
      };
    },
    transform: transformTaskResponse,
  } satisfies IpcCommandDefinition<number>,
  {
    method: "delete",
    path: taskIdPathCondition,
    command: "delete_task",
    buildPayload: (_request, taskId) => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          id: taskId,
          userId,
        },
      };
    },
    transform: transformDeleteTaskResponse,
  } satisfies IpcCommandDefinition<number>,
] as const;

export const taskCommandMatchers = createCommandMatchers(taskCommandDefinitions);
