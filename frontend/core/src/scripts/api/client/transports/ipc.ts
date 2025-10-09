import { authStorage } from "@/scripts/lib/authStorage";
import { tokenStorage } from "@/scripts/lib/tokenStorage";

import { ApiError, type ApiRequest, type ApiTransport, type TransportResponse } from "../types";
import { getTauriInvoke, type InvokeFn, toApiError } from "./ipc/shared";

const forcedTransport = (
  import.meta.env as unknown as Record<string, string | undefined>
).VITE_APP_TRANSPORT as "http" | "ipc" | undefined;

type IpcInvokeResponse = {
  status: number;
  body: unknown;
  headers: Record<string, string>;
};

type IpcCommandPayload = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
};

type IpcErrorData = Record<string, unknown> & {
  message?: string;
};

export function createIpcTransport(): ApiTransport | null {
  if (forcedTransport === "http") {
    return null;
  }

  const invoke = getTauriInvoke();
  if (!invoke) {
    return null;
  }

  return new IpcTransport(invoke);
}

class IpcTransport implements ApiTransport {
  readonly kind = "ipc" as const;

  constructor(private readonly invoke: InvokeFn) {}

  canHandle(request: ApiRequest): boolean {
    return true;
  }

  async send<T>(request: ApiRequest): Promise<TransportResponse<T>> {
    try {
      const response = await this.invoke<IpcInvokeResponse>(
        "dispatch_http_request",
        this.buildPayload(request),
      );

      if (response.status >= 400) {
        throw this.toApiError(response);
      }

      return { data: response.body as T, status: response.status };
    } catch (error) {
      throw toApiError(error);
    }
  }

  private buildPayload(request: ApiRequest): IpcCommandPayload {
    const headers: Record<string, string> = {
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const token = tokenStorage.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const body = this.serializeBody(request);

    return {
      method: request.method.toUpperCase(),
      path: request.url,
      headers,
      ...(body !== undefined ? { body } : {}),
    };
  }

  private serializeBody(request: ApiRequest): unknown {
    if (request.data === undefined) {
      return undefined;
    }

    if (typeof FormData !== "undefined" && request.data instanceof FormData) {
      return Object.fromEntries(Array.from(request.data.entries()));
    }

    return request.data;
  }

  private toApiError(response: IpcInvokeResponse): ApiError {
    const data = this.extractErrorData(response.body);
    const message = data.message ?? "IPC 呼び出しに失敗しました。";

    if (response.status === 401) {
      tokenStorage.removeToken();
      authStorage.clear();
    }

    return new ApiError(message, {
      status: response.status,
      data,
    });
  }

  private extractErrorData(body: unknown): IpcErrorData {
    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const message =
        typeof record.message === "string"
          ? record.message
          : "IPC 呼び出しに失敗しました。";
      return { ...record, message };
    }

    if (typeof body === "string") {
      return { message: body };
    }

    return { message: "IPC 呼び出しに失敗しました。" };
  }
}
