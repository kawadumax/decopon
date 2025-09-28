import axios, { type AxiosInstance } from "axios";

import { router } from "@lib/router";

import { authStorage } from "@/scripts/lib/authStorage";
import { tokenStorage } from "@/scripts/lib/tokenStorage";

import type { ApiRequest, ApiTransport, TransportResponse } from "../types";

export const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const httpClient = axios.create({
  baseURL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(
  async (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.removeToken();
      authStorage.clear();
      router.navigate({ to: "/guest/login" });
    }
    return Promise.reject(error);
  },
);

class HttpTransport implements ApiTransport {
  readonly kind = "http" as const;

  constructor(private readonly client: AxiosInstance) {}

  canHandle(): boolean {
    return true;
  }

  async send<T>(request: ApiRequest): Promise<TransportResponse<T>> {
    const response = await this.client.request<T>({
      method: request.method,
      url: request.url,
      data: request.data,
    });
    return { data: response.data as T, status: response.status };
  }
}

export function createHttpTransport(): ApiTransport {
  return new HttpTransport(httpClient);
}
