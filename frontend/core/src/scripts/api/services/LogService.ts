import type { ApiRequestData, Log } from "@/scripts/types";
import { endpoints } from "../endpoints";
import { callApi } from "../client";

export type LogQueryParams = {
  tagIds?: number[];
  taskId?: number | null;
  taskName?: string;
};

const buildLogQueryString = (params?: LogQueryParams): string => {
  const searchParams = new URLSearchParams();
  if (params?.tagIds && params.tagIds.length > 0) {
    for (const tagId of params.tagIds) {
      searchParams.append("tag_ids[]", tagId.toString());
    }
  }

  if (params?.taskId !== undefined && params.taskId !== null) {
    searchParams.append("task_id", params.taskId.toString());
  }

  const taskName = params?.taskName?.trim();
  if (taskName) {
    searchParams.append("task_name", taskName);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const LogService = {
  index(params?: LogQueryParams): Promise<Log[]> {
    const query = buildLogQueryString(params);
    return callApi<Log[]>("get", `${endpoints.logs.index}${query}`);
  },
  store(data: ApiRequestData): Promise<Log> {
    return callApi<Log>("post", endpoints.logs.store, data);
  },
  task(id: number): Promise<Log[]> {
    return callApi<Log[]>("get", endpoints.logs.task(id));
  },
};
