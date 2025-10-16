import { type MutationOptions, type Updater } from "@tanstack/react-query";
import { AuthService } from "../api/services/AuthService";
import { LogService } from "../api/services/LogService";
import { TagService } from "../api/services/TagService";
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

export const fetchLogsQueryOptions = {
  queryKey: ["logs"],
  queryFn: async (): Promise<Log[]> => {
    try {
      return await LogService.index();
    } catch (error) {
      logger("Failed to fetch logs:", error);
      return [];
    }
  },
  placeholderData: [],
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

export * from "./task";
export { queryClient } from "./client";
