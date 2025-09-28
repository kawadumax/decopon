import { authStorage } from "@/scripts/lib/authStorage";
import type {
  ApiRequestData,
  AuthResponse,
  Locale,
  Tag,
  Task,
} from "@/scripts/types";

import { ApiError } from "../../types";

export type InvokeFn = <T>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<T>;

export type IpcCommand = {
  command: string;
  payload: Record<string, unknown>;
  transform: (raw: unknown) => unknown;
  status?: number;
};

export type TauriWindow = Window & {
  __TAURI__?: {
    core?: {
      invoke: InvokeFn;
    };
  };
};

export function getTauriInvoke(): InvokeFn | null {
  if (typeof window === "undefined") {
    return null;
  }

  const global = window as TauriWindow;
  const invoke = global.__TAURI__?.core?.invoke;
  return typeof invoke === "function" ? invoke : null;
}

export function getPathname(url: string): string {
  try {
    return new URL(url, "http://ipc.local").pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export function getSearchParams(url: string): URLSearchParams {
  try {
    return new URL(url, "http://ipc.local").searchParams;
  } catch {
    const [, query] = url.split("?");
    return new URLSearchParams(query ?? "");
  }
}

export function ensureRecord(
  data: ApiRequestData | undefined,
  ...requiredKeys: string[]
): Record<string, unknown> {
  let record: Record<string, unknown> | undefined;

  if (isPlainRecord(data)) {
    record = data as Record<string, unknown>;
  } else if (typeof FormData !== "undefined" && data instanceof FormData) {
    record = Object.fromEntries(Array.from(data.entries()));
  }

  record = record ?? {};

  for (const key of requiredKeys) {
    if (!(key in record)) {
      throw new ApiError(`Missing required field: ${key}`, {
        code: "ipc.invalidPayload",
        data: { message: `Missing required field: ${key}` },
      });
    }
  }

  return record;
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getAuthenticatedUserId(): number {
  const auth = authStorage.get();
  const id = auth?.user?.id;

  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }

  throw new ApiError("ユーザー情報を取得できませんでした。", {
    status: 401,
    code: "auth.unauthorized",
    data: { message: "ユーザー情報を取得できませんでした。" },
  });
}

export function ensureNumber(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ApiError(`Invalid numeric value: ${field}`, {
      code: "ipc.invalidResponse",
      data: { message: `Invalid numeric value: ${field}` },
    });
  }
  return parsed;
}

export function getOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getOptionalNumberArray(
  value: unknown,
): number[] | undefined {
  if (Array.isArray(value)) {
    const numbers = value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
    return numbers.length > 0 ? numbers : undefined;
  }

  if (typeof value === "string") {
    const numbers = value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
    return numbers.length > 0 ? numbers : undefined;
  }

  return undefined;
}

export function getOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return String(value);
}

export function getOptionalBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === 1 || value === "1") {
    return true;
  }
  if (value === 0 || value === "0") {
    return false;
  }
  return undefined;
}

export function getDateTimeString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export function isFiniteNumber(value: number): value is number {
  return Number.isFinite(value);
}

export function transformTask(raw: unknown): Task {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const task = raw as Record<string, unknown>;

  return {
    id: ensureNumber(task.id, "task.id"),
    title: String(task.title ?? ""),
    description: String(task.description ?? ""),
    completed: Boolean(task.completed),
    parent_task_id: getOptionalNumber(task.parentTaskId),
    created_at: getDateTimeString(task.createdAt),
    updated_at: getDateTimeString(task.updatedAt),
    tags: Array.isArray(task.tags)
      ? task.tags.map((tag) => transformTag(tag))
      : [],
  };
}

export function transformTag(raw: unknown): Tag {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const tag = raw as Record<string, unknown>;

  return {
    id: ensureNumber(tag.id, "tag.id"),
    name: String(tag.name ?? ""),
    created_at: getDateTimeString(tag.createdAt),
    updated_at: getDateTimeString(tag.updatedAt),
  };
}

export function invalidResponseError(): ApiError {
  return new ApiError("IPC 応答の形式が不正です。", {
    code: "ipc.invalidResponse",
    data: { message: "IPC 応答の形式が不正です。" },
  });
}

export function toApiError(error: unknown): ApiError {
  if (isPlainRecord(error)) {
    const code = typeof error.code === "string" ? error.code : undefined;
    const message =
      typeof error.message === "string"
        ? error.message
        : "IPC 呼び出しに失敗しました。";

    return new ApiError(message, {
      code,
      status: statusFromIpcCode(code),
      data: {
        ...(isPlainRecord(error.data)
          ? (error.data as Record<string, unknown>)
          : {}),
        message,
        ...(code ? { code } : {}),
      },
      cause: error,
    });
  }

  return new ApiError("IPC 呼び出しに失敗しました。", {
    code: "ipc.unknown",
    status: 500,
    data: { message: String(error ?? "不明なエラーが発生しました。") },
    cause: error,
  });
}

export function statusFromIpcCode(code: string | undefined): number | undefined {
  if (!code) {
    return undefined;
  }

  if (code === "auth.unauthorized") {
    return 401;
  }

  if (code.endsWith("notFound")) {
    return 404;
  }

  if (code.endsWith("validation") || code === "request.invalid") {
    return 422;
  }

  if (code === "resource.conflict") {
    return 409;
  }

  return 500;
}

export function transformTaskListResponse(raw: unknown): Task[] {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { tasks?: unknown };
  if (!Array.isArray(payload.tasks)) {
    throw invalidResponseError();
  }

  return payload.tasks.map((task) => transformTask(task));
}

export function transformTaskResponse(raw: unknown): Task {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { task?: unknown };
  return transformTask(payload.task);
}

export function transformDeleteTaskResponse(raw: unknown): void {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { success?: unknown };
  if (payload.success !== true) {
    throw new ApiError("タスクの削除に失敗しました。", {
      code: "tasks.deleteFailed",
      data: { message: "タスクの削除に失敗しました。" },
    });
  }
}

export function transformLoginResponse(raw: unknown): AuthResponse {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as {
    session?: {
      token?: unknown;
      user?: Record<string, unknown>;
    };
  };
  const session = payload.session;

  if (!isPlainRecord(session)) {
    throw invalidResponseError();
  }

  const user = session.user;

  if (!isPlainRecord(user)) {
    throw invalidResponseError();
  }

  const locale = String(user.locale ?? "en") as Locale;
  const token = session.token;

  if (typeof token !== "string" || token.length === 0) {
    throw invalidResponseError();
  }

  return {
    token,
    user: {
      id: ensureNumber(user.id, "user.id"),
      name: String(user.name ?? ""),
      email: String(user.email ?? ""),
      work_time: ensureNumber(user.workTime, "user.workTime"),
      break_time: ensureNumber(user.breakTime, "user.breakTime"),
      locale,
      email_verified_at: undefined,
    },
  };
}
