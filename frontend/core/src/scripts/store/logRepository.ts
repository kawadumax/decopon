import type { Log } from "@/scripts/types";
import type { LogQueryParams } from "@/scripts/api/services/LogService";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type LogListKey = string;

export type NormalizedLogParams = {
  tagIds: number[];
  taskId: number | null;
  taskName: string;
};

export const normalizeLogParams = (
  params?: LogQueryParams,
): NormalizedLogParams => {
  const tagIds = params?.tagIds ? [...params.tagIds] : [];
  tagIds.sort((a, b) => a - b);
  const taskName = params?.taskName?.trim() ?? "";
  const taskId = params?.taskId ?? null;

  return {
    tagIds,
    taskId,
    taskName,
  };
};

export const buildLogListKey = (
  params?: LogQueryParams | NormalizedLogParams,
): LogListKey => {
  const normalized = normalizeLogParams(params);
  const { tagIds, taskId, taskName } = normalized;
  const tagsKey = tagIds.length > 0 ? tagIds.join(",") : "none";
  const taskIdKey = taskId === null ? "none" : String(taskId);
  const taskNameKey = taskName || "none";
  return `tags:${tagsKey}|taskId:${taskIdKey}|taskName:${taskNameKey}`;
};

interface LogRepositoryState {
  logsById: Record<number, Log>;
  logLists: Record<LogListKey, number[]>;
  setLogsForParams: (params: LogQueryParams | NormalizedLogParams, logs: Log[]) => void;
  upsertLog: (log: Log) => void;
  addLogToList: (params: LogQueryParams | NormalizedLogParams, logId: number) => void;
}

export const useLogRepository = create<LogRepositoryState>()(
  immer((set) => ({
    logsById: {},
    logLists: {},
    setLogsForParams: (params, logs) =>
      set((state) => {
        const key = buildLogListKey(params);
        for (const log of logs) {
          state.logsById[log.id] = log;
        }
        state.logLists[key] = logs.map((log) => log.id);
      }),
    upsertLog: (log) =>
      set((state) => {
        state.logsById[log.id] = log;
      }),
    addLogToList: (params, logId) =>
      set((state) => {
        const key = buildLogListKey(params);
        const list = state.logLists[key];
        if (!list) {
          state.logLists[key] = [logId];
          return;
        }
        if (!list.includes(logId)) {
          list.push(logId);
        }
      }),
  })),
);

export const useLogList = (params?: LogQueryParams) =>
  useLogRepository((state) => {
    const key = buildLogListKey(params);
    const ids = state.logLists[key] ?? [];
    return ids
      .map((id) => state.logsById[id])
      .filter(Boolean) // undefinedやnullを取り除く
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  });
