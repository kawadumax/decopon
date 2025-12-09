import axios from "axios";

import { NProgressManager } from "@lib/nProgressManager";

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

export type ApiClientHooks = {
  onSuccess?: (response: TransportResponse<unknown>, options?: CallApiOptions) => void;
  onError?: (error: unknown, options?: CallApiOptions) => void;
  onUnauthorized?: (error: ApiError) => void;
};

const defaultHooks: ApiClientHooks = {
  onSuccess: () => {},
  onError: () => {},
  onUnauthorized: () => {},
};

export function createApiClient(hooks: ApiClientHooks = defaultHooks) {
  const resolver = new TransportResolver();

  async function callApi<T = unknown>(
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
      hooks.onSuccess?.(response, options);
      return response.data;
    } catch (error) {
      handleError(error, options);
    } finally {
      progressManager.decrementRequests();
    }

    throw new Error("Unreachable");
  }

  function handleError(error: unknown, options?: CallApiOptions): never {
    if (axios.isAxiosError(error)) {
      hooks.onError?.(error, options);
      throw error;
    }

    if (error instanceof ApiError) {
      if (error.response?.status === 401) {
        hooks.onUnauthorized?.(error);
      }
      hooks.onError?.(error, options);
      throw error;
    }

    hooks.onError?.(error, options);
    throw error;
  }

  return { callApi };
}

let currentClient = createApiClient();

export function configureApiClient(hooks?: ApiClientHooks) {
  currentClient = createApiClient(hooks);
}

export function getApiClient() {
  return currentClient;
}

export async function callApi<T = unknown>(
  method: ApiMethod,
  url: string,
  requestData?: ApiRequestData,
  options?: CallApiOptions,
): Promise<T> {
  return currentClient.callApi<T>(method, url, requestData, options);
}

export { baseURL, httpClient, ApiError };
export type { CallApiOptions, TransportResponse };
