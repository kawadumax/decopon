import { authStorage } from "@/scripts/lib/authStorage";
import {
  DecoponSessionStatus,
  Locale,
  LogSource,
  type ApiRequestData,
  type AuthResponse,
  type CycleCount,
  type DecoponSession,
  type Log,
  type PreferenceResponse,
  type ProfileResponse,
  type StatusResponse,
  type Tag,
  type Task,
  type User,
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

export function ensureNumberArray(value: unknown, field: string): number[] {
  const numbers = getOptionalNumberArray(value);

  if (!numbers || numbers.length === 0) {
    throw new ApiError(`Invalid numeric array: ${field}`, {
      code: "ipc.invalidResponse",
      data: { message: `Invalid numeric array: ${field}` },
    });
  }

  return numbers;
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

const LOCALE_VALUES = Object.values(Locale);
const LOG_SOURCE_VALUES = Object.values(LogSource);
const DECOPON_SESSION_STATUS_VALUES = Object.values(DecoponSessionStatus);

function ensureEnumValue<T extends string>(
  values: readonly T[],
  value: unknown,
  field: string,
): T {
  if (typeof value === "string" && values.includes(value as T)) {
    return value as T;
  }

  throw new ApiError(`Invalid enum value: ${field}`, {
    code: "ipc.invalidResponse",
    data: { message: `Invalid enum value: ${field}` },
  });
}

export function ensureLocale(value: unknown, field: string): Locale {
  return ensureEnumValue(LOCALE_VALUES as Locale[], value, field);
}

export function ensureLogSource(value: unknown, field: string): LogSource {
  return ensureEnumValue(LOG_SOURCE_VALUES as LogSource[], value, field);
}

export function ensureDecoponSessionStatus(
  value: unknown,
  field: string,
): DecoponSessionStatus {
  return ensureEnumValue(
    DECOPON_SESSION_STATUS_VALUES as DecoponSessionStatus[],
    value,
    field,
  );
}

function getRecordValue(
  record: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }
  return undefined;
}

export function transformUser(raw: unknown): User {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const user = raw as Record<string, unknown>;

  return {
    id: ensureNumber(user.id, "user.id"),
    name: String(user.name ?? ""),
    email: String(user.email ?? ""),
    work_time: ensureNumber(
      getRecordValue(user, "workTime", "work_time"),
      "user.workTime",
    ),
    break_time: ensureNumber(
      getRecordValue(user, "breakTime", "break_time"),
      "user.breakTime",
    ),
    locale: ensureLocale(user.locale, "user.locale"),
    email_verified_at: getOptionalString(
      getRecordValue(user, "emailVerifiedAt", "email_verified_at"),
    ),
  };
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

  const token = session.token;

  if (typeof token !== "string" || token.length === 0) {
    throw invalidResponseError();
  }

  return {
    token,
    user: transformUser(user),
  };
}

export function transformStatusResponse(raw: unknown): StatusResponse {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { status?: unknown };

  if (typeof payload.status !== "string" || payload.status.length === 0) {
    throw invalidResponseError();
  }

  return { status: payload.status };
}

export function transformPreferenceResponse(
  raw: unknown,
): PreferenceResponse {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as Record<string, unknown>;

  return {
    work_time: ensureNumber(
      getRecordValue(payload, "workTime", "work_time"),
      "preference.workTime",
    ),
    break_time: ensureNumber(
      getRecordValue(payload, "breakTime", "break_time"),
      "preference.breakTime",
    ),
    locale: ensureLocale(payload.locale, "preference.locale"),
  };
}

export function transformProfileMetaResponse(raw: unknown): ProfileResponse {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  if ("id" in raw && typeof (raw as Record<string, unknown>).id === "number") {
    return {
      mustVerifyEmail: false,
      user: transformUser(raw),
    };
  }

  const payload = raw as Record<string, unknown>;
  const mustVerifyEmail =
    typeof payload.mustVerifyEmail === "boolean" ? payload.mustVerifyEmail : false;
  const statusValue = payload.status;
  const status =
    typeof statusValue === "string" && statusValue.length > 0
      ? statusValue
      : undefined;

  const userValue = payload.user;
  const user =
    userValue !== undefined && userValue !== null
      ? transformUser(userValue)
      : undefined;

  return {
    mustVerifyEmail,
    ...(status ? { status } : {}),
    ...(user ? { user } : {}),
  };
}

export function transformTagListResponse(raw: unknown): Tag[] {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { tags?: unknown };

  if (!Array.isArray(payload.tags)) {
    throw invalidResponseError();
  }

  return payload.tags.map((tag) => transformTag(tag));
}

export function transformTagResponse(raw: unknown): Tag {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { tag?: unknown };
  return transformTag(payload.tag);
}

export function transformOptionalTagResponse(raw: unknown): Tag | null {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { tag?: unknown };

  if (payload.tag === null || payload.tag === undefined) {
    return null;
  }

  return transformTag(payload.tag);
}

export function transformDeleteTagsResponse(raw: unknown): void {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { success?: unknown };
  if (payload.success !== true) {
    throw invalidResponseError();
  }
}

export function transformLog(raw: unknown): Log {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const log = raw as Record<string, unknown>;

  return {
    id: ensureNumber(log.id, "log.id"),
    content: String(log.content ?? ""),
    source: ensureLogSource(log.source, "log.source"),
    created_at: getDateTimeString(
      getRecordValue(log, "createdAt", "created_at"),
    ),
    updated_at: getDateTimeString(
      getRecordValue(log, "updatedAt", "updated_at"),
    ),
    user_id: ensureNumber(
      getRecordValue(log, "userId", "user_id"),
      "log.userId",
    ),
    task_id: getOptionalNumber(getRecordValue(log, "taskId", "task_id")),
  };
}

export function transformLogListResponse(raw: unknown): Log[] {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { logs?: unknown };

  if (!Array.isArray(payload.logs)) {
    throw invalidResponseError();
  }

  return payload.logs.map((log) => transformLog(log));
}

export function transformLogResponse(raw: unknown): Log {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { log?: unknown };
  return transformLog(payload.log);
}

export function transformDecoponSession(raw: unknown): DecoponSession {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const session = raw as Record<string, unknown>;
  const endedRaw = getRecordValue(session, "endedAt", "ended_at");

  return {
    id: ensureNumber(session.id, "decoponSession.id"),
    status: ensureDecoponSessionStatus(
      session.status,
      "decoponSession.status",
    ),
    started_at: getDateTimeString(
      getRecordValue(session, "startedAt", "started_at"),
    ),
    ended_at:
      endedRaw === null || endedRaw === undefined
        ? null
        : getDateTimeString(endedRaw),
    created_at: getDateTimeString(
      getRecordValue(session, "createdAt", "created_at"),
    ),
    updated_at: getDateTimeString(
      getRecordValue(session, "updatedAt", "updated_at"),
    ),
    user_id: ensureNumber(
      getRecordValue(session, "userId", "user_id"),
      "decoponSession.userId",
    ),
  };
}

export function transformDecoponSessionListResponse(
  raw: unknown,
): DecoponSession[] {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { sessions?: unknown };

  if (!Array.isArray(payload.sessions)) {
    throw invalidResponseError();
  }

  return payload.sessions.map((session) => transformDecoponSession(session));
}

export function transformDecoponSessionResponse(raw: unknown): DecoponSession {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { session?: unknown };
  return transformDecoponSession(payload.session);
}

export function transformDeleteDecoponSessionResponse(raw: unknown): void {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as { success?: unknown };
  if (payload.success !== true) {
    throw invalidResponseError();
  }
}

export function transformCycleCountResponse(raw: unknown): CycleCount {
  if (!isPlainRecord(raw)) {
    throw invalidResponseError();
  }

  const payload = raw as Record<string, unknown>;

  return {
    date: String(payload.date ?? ""),
    count: ensureNumber(payload.count, "cycleCount.count"),
  };
}

export function transformVoidResponse(raw: unknown): void {
  if (
    raw === null ||
    raw === undefined ||
    (isPlainRecord(raw) && Object.keys(raw).length === 0)
  ) {
    return undefined;
  }

  throw invalidResponseError();
}
