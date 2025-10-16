import { ApiError } from "../../types";

export type InvokeFn = <T>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<T>;

export type TauriWindow = Window & {
  __TAURI__?: {
    core?: {
      invoke?: InvokeFn;
    };
    invoke?: InvokeFn;
  };
  __TAURI_INTERNALS__?: {
    invoke?: InvokeFn;
  };
};

let cachedInvoke: InvokeFn | null | undefined;

export function getTauriInvoke(): InvokeFn | null {
  if (cachedInvoke !== undefined) {
    return cachedInvoke;
  }

  if (typeof window === "undefined") {
    cachedInvoke = null;
    return cachedInvoke;
  }

  const global = window as TauriWindow;
  const candidates: Array<InvokeFn | undefined> = [
    global.__TAURI__?.core?.invoke,
    global.__TAURI__?.invoke,
    global.__TAURI_INTERNALS__?.invoke,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "function") {
      cachedInvoke = candidate;
      return candidate;
    }
  }

  cachedInvoke = null;
  return cachedInvoke;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (typeof error === "string") {
    return new ApiError(error, {
      status: 500,
      data: { message: error },
      cause: error,
    });
  }

  if (error && typeof error === "object") {
    const payload = error as Record<string, unknown>;
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "IPC 呼び出しに失敗しました。";

    return new ApiError(message, {
      status: typeof payload.status === "number" ? payload.status : 500,
      data: {
        ...(typeof payload.data === "object" && payload.data
          ? (payload.data as Record<string, unknown>)
          : {}),
        message,
      },
      cause: error,
    });
  }

  return new ApiError("IPC 呼び出しに失敗しました。", {
    status: 500,
    data: { message: "IPC 呼び出しに失敗しました。" },
    cause: error,
  });
}
