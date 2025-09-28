import { endpoints } from "../../../../endpoints";
import {
  ensureRecord,
  getAuthenticatedUserId,
  getOptionalBoolean,
  getOptionalNumber,
  getOptionalNumberArray,
  getOptionalString,
  getPathname,
  getSearchParams,
  isFiniteNumber,
  transformDeleteTaskResponse,
  transformTaskListResponse,
  transformTaskResponse,
} from "../shared";

import type { IpcCommandMatcher } from "./types";

const matchListTasksRequest: IpcCommandMatcher = (request) => {
  if (request.method !== "get") {
    return null;
  }

  if (getPathname(request.url) !== endpoints.tasks.index) {
    return null;
  }

  const userId = getAuthenticatedUserId();
  const searchParams = getSearchParams(request.url);
  const tagIds = searchParams.getAll("tag_ids").map(Number).filter(isFiniteNumber);

  return {
    command: "list_tasks",
    payload: {
      request: {
        userId,
        ...(tagIds.length > 0 ? { tagIds } : {}),
      },
    },
    transform: transformTaskListResponse,
  };
};

const matchCreateTaskRequest: IpcCommandMatcher = (request) => {
  if (request.method !== "post") {
    return null;
  }

  if (getPathname(request.url) !== endpoints.tasks.store) {
    return null;
  }

  const userId = getAuthenticatedUserId();
  const payload = ensureRecord(request.data);

  return {
    command: "create_task",
    payload: {
      request: {
        userId,
        title: String(payload.title ?? ""),
        description: getOptionalString(payload.description),
        parentTaskId: getOptionalNumber(payload.parent_task_id),
        tagIds: getOptionalNumberArray(payload.tag_ids),
      },
    },
    transform: transformTaskResponse,
  };
};

const matchUpdateTaskRequest: IpcCommandMatcher = (request) => {
  if (request.method !== "put") {
    return null;
  }

  const taskId = parseTaskId(getPathname(request.url));
  if (taskId === null) {
    return null;
  }

  const userId = getAuthenticatedUserId();
  const payload = ensureRecord(request.data);

  return {
    command: "update_task",
    payload: {
      request: {
        id: taskId,
        userId,
        title: getOptionalString(payload.title),
        description: getOptionalString(payload.description),
        completed: getOptionalBoolean(payload.completed),
        parentTaskId: getOptionalNumber(payload.parent_task_id),
        tagIds: getOptionalNumberArray(payload.tag_ids),
      },
    },
    transform: transformTaskResponse,
  };
};

const matchDeleteTaskRequest: IpcCommandMatcher = (request) => {
  if (request.method !== "delete") {
    return null;
  }

  const taskId = parseTaskId(getPathname(request.url));
  if (taskId === null) {
    return null;
  }

  const userId = getAuthenticatedUserId();

  return {
    command: "delete_task",
    payload: {
      request: {
        id: taskId,
        userId,
      },
    },
    transform: transformDeleteTaskResponse,
  };
};

export const taskCommandMatchers: IpcCommandMatcher[] = [
  matchListTasksRequest,
  matchCreateTaskRequest,
  matchUpdateTaskRequest,
  matchDeleteTaskRequest,
];

function parseTaskId(pathname: string): number | null {
  const match = pathname.match(/^\/tasks\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}
