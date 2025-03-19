import { callApi } from "@/lib/apiClient";
import type { ApiData } from "@/types";
import axios, { type AxiosResponse } from "axios";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type FnOnSucsess = (response: AxiosResponse) => void;
type FnOnError = (error: unknown) => void;
type FnOnFinaly = () => void;

export function useApi() {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const request = useCallback(
    async (
      method: "get" | "post" | "put" | "delete",
      url: string,
      data?: ApiData,
      onSuccess?: FnOnSucsess,
      onError?: FnOnError,
      onFinaly?: FnOnFinaly,
    ) => {
      setLoading(true);
      try {
        const responseData = await callApi(method, url, data);
        const message = t(responseData.i18nKey) || responseData.message;
        message && toast.success(message);
        onSuccess?.(responseData);
        return responseData;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const message =
            t(error.response?.data.i18nKey) || error.response?.data.message;
          message && toast.error(message);
        }
        onError?.(error);
        throw error;
      } finally {
        onFinaly?.();
        setLoading(false);
      }
    },
    [t],
  );

  const api = useMemo(
    () => ({
      get: (
        url: string,
        onSuccess?: FnOnSucsess,
        onError?: FnOnError,
        onFinaly?: FnOnFinaly,
      ) => request("get", url, undefined, onSuccess, onError, onFinaly),
      post: (
        url: string,
        data: ApiData,
        onSuccess?: FnOnSucsess,
        onError?: FnOnError,
        onFinaly?: FnOnFinaly,
      ) => request("post", url, data, onSuccess, onError, onFinaly),
      put: (
        url: string,
        data: ApiData,
        onSuccess?: FnOnSucsess,
        onError?: FnOnError,
        onFinaly?: FnOnFinaly,
      ) => request("put", url, data, onSuccess, onError, onFinaly),
      delete: (
        url: string,
        data?: ApiData,
        onSuccess?: FnOnSucsess,
        onError?: FnOnError,
        onFinaly?: FnOnFinaly,
      ) => request("delete", url, data, onSuccess, onError, onFinaly),
    }),
    [request],
  );

  return api;
}
