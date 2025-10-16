import axios from "axios";

import { NProgressManager } from "@lib/nProgressManager";
import { router } from "@lib/router";
import { ToastMessageManager } from "@/scripts/lib/toastMessageManager";

import { authStorage } from "@/scripts/lib/authStorage";
import { tokenStorage } from "@/scripts/lib/tokenStorage";

import type { ApiRequestData } from "@/scripts/types";

import {
  ApiError,
  type ApiMethod,
  type ApiRequest,
  type ApiTransport,
  type CallApiOptions,
  type TransportResponse,
} from "./types";
import { createHttpTransport, baseURL, httpClient } from "./transports/http";
import { createIpcTransport } from "./transports/ipc";

const progressManager = NProgressManager.getInstance();

class TransportResolver {
  private transports: ApiTransport[] | null = null;

  private ensureTransports(): ApiTransport[] {
    if (this.transports) {
      return this.transports;
    }

    const transports: ApiTransport[] = [];
    const ipcTransport = createIpcTransport();

    if (ipcTransport) {
      transports.push(ipcTransport);
    }

    const httpTransport = createHttpTransport();
    transports.push(httpTransport);

    this.transports = transports;
    return transports;
  }

  resolve(request: ApiRequest): ApiTransport {
    const transports = this.ensureTransports();

    for (const transport of transports) {
      if (transport.canHandle(request)) {
        return transport;
      }
    }

    return transports[transports.length - 1];
  }
}

const resolver = new TransportResolver();

export async function callApi<T = unknown>(
  method: ApiMethod,
  url: string,
  requestData?: ApiRequestData,
  options?: CallApiOptions,
): Promise<T> {
  const request: ApiRequest = { method, url, data: requestData };
  const transport = resolver.resolve(request);

  try {
    progressManager.incrementRequests();
    const response = await transport.send<T>(request);
    notifySuccess(response, options);
    return response.data;
  } catch (error) {
    handleError(error, options);
  } finally {
    progressManager.decrementRequests();
  }

  throw new Error("Unreachable");
}

function notifySuccess<T>(
  response: TransportResponse<T>,
  options?: CallApiOptions,
) {
  ToastMessageManager.notifyWithFallback("success", {
    baseKeys: [options?.toast?.success],
    status: response.status,
  });
}

function handleError(error: unknown, options?: CallApiOptions): never {
  if (axios.isAxiosError(error)) {
    ToastMessageManager.notifyWithFallback("error", {
      baseKeys: [options?.toast?.error, options?.toast?.success, "api.unknown"],
      status: error.response?.status,
      fallbackMessage: error.response?.data?.message,
    });
    throw error;
  }

  if (error instanceof ApiError) {
    const status = error.response?.status;

    if (status === 401) {
      tokenStorage.removeToken();
      authStorage.clear();
    }

    ToastMessageManager.notifyWithFallback("error", {
      baseKeys: [options?.toast?.error, options?.toast?.success, "api.unknown"],
      status,
      fallbackMessage: error.response?.data?.message ?? error.message,
    });

    if (status === 401) {
      router.navigate({ to: "/guest/login" });
    }

    throw error;
  }

  throw error;
}

export { baseURL, httpClient, ApiError };
export type { CallApiOptions };
