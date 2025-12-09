import axios from "axios";

import { router } from "@lib/router";

import { authStorage } from "@/scripts/lib/authStorage";
import { tokenStorage } from "@/scripts/lib/tokenStorage";
import { ToastMessageManager } from "@/scripts/lib/toastMessageManager";

import { ApiError, type ApiClientHooks, type CallApiOptions, type TransportResponse } from "./index";

export function createWebApiHooks(): ApiClientHooks {
  return {
    onSuccess: (response: TransportResponse<unknown>, options?: CallApiOptions) => {
      ToastMessageManager.notifyWithFallback("success", {
        baseKeys: [options?.toast?.success],
        status: response.status,
      });
    },
    onError: (error: unknown, options?: CallApiOptions) => {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : error instanceof ApiError
          ? error.response?.status
          : undefined;
      const fallbackMessage = axios.isAxiosError(error)
        ? error.response?.data?.message
        : error instanceof ApiError
          ? error.response?.data?.message ?? error.message
          : undefined;

      ToastMessageManager.notifyWithFallback("error", {
        baseKeys: [options?.toast?.error, options?.toast?.success, "api.unknown"],
        status,
        fallbackMessage,
      });
    },
    onUnauthorized: () => {
      tokenStorage.removeToken();
      authStorage.clear();
      router.navigate({ to: "/guest/login" });
    },
  };
}
