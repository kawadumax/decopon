import type { ApiRequestData } from "@/scripts/types";
import { NProgressManager } from "@lib/nProgressManager";
import { authStorage } from "@/scripts/lib/authStorage";
import { tokenStorage } from "@/scripts/lib/tokenStorage";
import { ToastMessageManager } from "@/scripts/lib/toastMessageManager";
import { router } from "@lib/router";
import axios from "axios";

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

const progressManager = NProgressManager.getInstance();

type ToastOptions = {
  success?: string;
  error?: string;
};

type CallApiOptions = {
  toast?: ToastOptions;
};

// APIを呼び出すための汎用関数
export async function callApi<T = unknown>(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  requestData?: ApiRequestData,
  options?: CallApiOptions,
): Promise<T> {
  try {
    progressManager.incrementRequests();
    const response = await httpClient({ method, url, data: requestData });
    const data = response.data;
    ToastMessageManager.notifyWithFallback("success", {
      baseKeys: [options?.toast?.success],
      status: response.status,
    });
    return data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      ToastMessageManager.notifyWithFallback("error", {
        baseKeys: [
          options?.toast?.error,
          options?.toast?.success,
          "api.unknown",
        ],
        status,
        fallbackMessage: error.response?.data?.message,
      });
      throw error;
    }
    throw error;
  } finally {
    progressManager.decrementRequests();
  }
}
