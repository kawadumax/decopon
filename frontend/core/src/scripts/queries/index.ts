import {
  type MutationOptions,
  type QueryKey,
  type Updater,
} from "@tanstack/react-query";
import { AuthService } from "../api/services/AuthService";
import { LogService, type LogQueryParams } from "../api/services/LogService";
import {
  buildLogListKey,
  type NormalizedLogParams,
  normalizeLogParams,
  useLogRepository,
} from "../store/logRepository";
import { TagService } from "../api/services/TagService";
import { useTaskRepository } from "../store/taskRepository";
import { authStorage, AUTH_CACHE_TTL_MS } from "../lib/authStorage";
import {
  isSingleUserModeEnabled,
  SingleUserBootstrapUnavailableError,
  singleUserBootstrap,
} from "../lib/singleUserBootstrap";
import { tokenStorage } from "../lib/tokenStorage";
import { logger } from "../lib/utils";
import type { Auth, Log, Tag, User } from "../types";
import { queryClient } from "./client";

if (typeof window !== "undefined") {
  const token = tokenStorage.getToken();
  if (token) {
    const cachedAuth = authStorage.get();
    if (cachedAuth) {
      queryClient.setQueryData(["auth"], cachedAuth);
    }
  } else {
    authStorage.clear();
  }
}

export const fetchAuthQueryOptions = {
  queryKey: ["auth"],
  staleTime: AUTH_CACHE_TTL_MS,
  queryFn: async (): Promise<Auth> => {
    let token = tokenStorage.getToken();
    if (!token && isSingleUserModeEnabled()) {
      try {
        await singleUserBootstrap();
        token = tokenStorage.getToken();
      } catch (error) {
        throw new SingleUserBootstrapUnavailableError(
          "Single-user session is unavailable.",
          error,
        );
      }
    }
    if (!token) {
      authStorage.clear();
      return { user: undefined };
    }
    const cachedAuth = authStorage.get();
    if (cachedAuth) {
      return cachedAuth;
    }
    try {
      const user = await AuthService.getUser();
      const auth = { user } as Auth;
      authStorage.set(auth);
      return auth;
    } catch (error) {
      logger("Failed to fetch user data:", error);
      tokenStorage.removeToken();
      authStorage.clear();
      queryClient.setQueryData(["auth"], { user: undefined });
      return { user: undefined };
    }
  },
};

export const buildLogsQueryKey = (
  params?: LogQueryParams | NormalizedLogParams,
): QueryKey => {
  const normalized = normalizeLogParams(params);
  return ["logs", buildLogListKey(normalized)];
};

export const fetchLogsQueryOptions = (params?: LogQueryParams) => {
  const normalized = normalizeLogParams(params);
  const queryKey = buildLogsQueryKey(normalized);
  const queryParams: LogQueryParams = {
    tagIds: normalized.tagIds,
    taskId: normalized.taskId ?? undefined,
    taskName: normalized.taskName || undefined,
  };

  return {
    queryKey,
    queryFn: async (): Promise<Log[]> => {
      try {
        const logs = await LogService.index(queryParams);
        const { setLogsForParams } = useLogRepository.getState();
        setLogsForParams(normalized, logs);
        return logs;
      } catch (error) {
        const axiosLikeError = error as {
          response?: { status?: number; data?: unknown };
          message?: string;
        };
        logger("Failed to fetch logs:", error);
        return [];
      }
    },
    placeholderData: [],
  };
};

export const fetchTagsQueryOptions = {
  queryKey: ["tags"],
  queryFn: async (): Promise<Tag[]> => {
    try {
      return await TagService.index();
    } catch (error) {
      logger("Failed to fetch tags:", error);
      return [];
    }
  },
  placeholderData: [],
};

export const fetchTaskLogsQueryOptions = (taskId?: number) => ({
  queryKey: ["logs", taskId],
  enabled: !!taskId,
  queryFn: async (): Promise<Log[]> => {
    if (!taskId) return [];
    try {
      const logs = await LogService.task(taskId);
      const normalized = normalizeLogParams({ taskId });
      const { setLogsForParams } = useLogRepository.getState();
      setLogsForParams(normalized, logs ?? []);
      return logs ?? [];
    } catch (error) {
      logger("Failed to fetch task logs:", error);
      return [];
    }
  },
  placeholderData: [],
});

export const storeLogMutationOptions: MutationOptions<
  Log,
  unknown,
  Partial<Log>
> = {
  mutationFn: async (data) => await LogService.store(data),
  mutationKey: ["logs"],
  onError: (error: unknown) => {
    logger("error log storing", error);
  },
};

export const setLogs = (
  updater: Updater<Log[] | undefined, Log[] | undefined>,
  taskId?: string | number,
) => {
  const key = taskId ? ["logs", taskId] : ["logs"];
  queryClient.setQueryData<Log[]>(key, updater);
};

export const setTags = (
  updater: Updater<Tag[] | undefined, Tag[] | undefined>,
) => {
  queryClient.setQueryData<Tag[]>(["tags"], updater);
};

export const attachTagToTask = async (taskId: number, tagName: string) => {
  const newTag = await TagService.relation({
    task_id: taskId,
    name: tagName,
  });
  setTags((prev: Tag[] = []) => {
    const exists = prev.find((tag) => tag.id === newTag.id);
    if (exists) {
      return prev.map((tag) => (tag.id === newTag.id ? newTag : tag));
    }
    return [newTag, ...prev];
  });
  const { appendTagToTask } = useTaskRepository.getState();
  appendTagToTask(taskId, newTag);
  await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  return newTag;
};

export const detachTagFromTask = async (taskId: number, tagName: string) => {
  const removedTag = await TagService.relationDestroy({
    task_id: taskId,
    name: tagName,
  });
  const { removeTagFromTask } = useTaskRepository.getState();
  if (removedTag) {
    setTags((prev: Tag[] = []) =>
      prev.map((tag) => (tag.id === removedTag.id ? removedTag : tag)),
    );
    removeTagFromTask(taskId, { id: removedTag.id });
  } else {
    removeTagFromTask(taskId, { name: tagName });
  }
  await queryClient.invalidateQueries({ queryKey: ["tasks"] });
  return removedTag;
};

export const createTag = async (name: string): Promise<Tag> => {
  const tag = await TagService.store({ name });
  setTags((prev: Tag[] = []) => [...prev, tag]);
  return tag;
};

export const deleteTags = async (ids: number[]): Promise<void> => {
  await TagService.destroyMany({ tag_ids: ids });
  setTags((prev: Tag[] = []) =>
    prev.filter((tag) => !ids.includes(tag.id)),
  );
};

export const createTagMutationOptions = (): MutationOptions<
  Tag,
  unknown,
  string,
  unknown
> => ({
  mutationFn: async (name: string) => await createTag(name),
});

export const deleteTagMutationOptions = (): MutationOptions<
  void,
  unknown,
  number[],
  unknown
> => ({
  mutationFn: deleteTags,
});

export * from "./task";
export * from "./decoponSession";
export { queryClient } from "./client";
