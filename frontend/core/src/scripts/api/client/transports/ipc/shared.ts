import { ApiError } from "../../types";

export type InvokeFn = <T>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<T>;

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
