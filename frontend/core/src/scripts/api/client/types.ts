import type { ApiRequestData } from "@/scripts/types";

export type ApiMethod = "get" | "post" | "put" | "delete" | "patch";

export type ApiRequest = {
  method: ApiMethod;
  url: string;
  data?: ApiRequestData;
};

export type TransportResponse<T> = {
  data: T;
  status?: number;
};

type ToastOptions = {
  success?: string;
  error?: string;
};

export type CallApiOptions = {
  toast?: ToastOptions;
};

export type ApiErrorResponseData = {
  message?: string;
  code?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  readonly response?: {
    status?: number;
    data: ApiErrorResponseData;
  };

  readonly code?: string;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      data?: ApiErrorResponseData;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;

    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }

    if (options.status !== undefined || options.data !== undefined) {
      const data: ApiErrorResponseData = {
        message,
        ...(options.data ?? {}),
      };

      if (options.data?.message) {
        data.message = options.data.message;
      }

      if (options.code) {
        data.code = options.code;
      }

      this.response = {
        status: options.status,
        data,
      };
    }
  }
}

export interface ApiTransport {
  readonly kind: "http" | "ipc";
  canHandle(request: ApiRequest): boolean;
  send<T>(request: ApiRequest): Promise<TransportResponse<T>>;
}
