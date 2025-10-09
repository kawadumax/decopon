import { endpoints } from "../../../../endpoints";
import {
  ensureNumber,
  ensureNumberArray,
  ensureRecord,
  getAuthenticatedUserId,
  transformDeleteTagsResponse,
  transformOptionalTagResponse,
  transformTagListResponse,
  transformTagResponse,
} from "../shared";

import {
  createCommandMatchers,
  type IpcCommandDefinition,
} from "./types";

export const tagCommandDefinitions = [
  {
    method: "get",
    path: endpoints.tags.index,
    command: "list_tags",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();

      return {
        request: {
          userId,
        },
      };
    },
    transform: transformTagListResponse,
  },
  {
    method: "post",
    path: endpoints.tags.store,
    command: "create_tag",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "name");

      return {
        request: {
          userId,
          name: String(payload.name ?? ""),
        },
      };
    },
    transform: transformTagResponse,
  },
  {
    method: "post",
    path: endpoints.tags.relation,
    command: "attach_tag_to_task",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "task_id", "name");

      return {
        request: {
          userId,
          taskId: ensureNumber(payload.task_id, "tag.task_id"),
          name: String(payload.name ?? ""),
        },
      };
    },
    transform: transformTagResponse,
  },
  {
    method: "delete",
    path: endpoints.tags.relationDestroy,
    command: "detach_tag_from_task",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "task_id", "name");

      return {
        request: {
          userId,
          taskId: ensureNumber(payload.task_id, "tag.task_id"),
          name: String(payload.name ?? ""),
        },
      };
    },
    transform: transformOptionalTagResponse,
  },
  {
    method: "delete",
    path: endpoints.tags.destroyMany,
    command: "delete_tags",
    buildPayload: (request) => {
      const userId = getAuthenticatedUserId();
      const payload = ensureRecord(request.data, "tag_ids");

      return {
        request: {
          userId,
          tagIds: ensureNumberArray(payload.tag_ids, "tag.tag_ids"),
        },
      };
    },
    transform: transformDeleteTagsResponse,
  },
] as const satisfies readonly IpcCommandDefinition[];

export const tagCommandMatchers = createCommandMatchers(tagCommandDefinitions);
