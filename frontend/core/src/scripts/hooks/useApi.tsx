import type { ApiData } from "@/scripts/types";
import { callApi } from "@lib/apiClient";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type ResponseData = any;

type FnOnSucsess = (resData: ResponseData) => void;
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
        const resData = await callApi(method, url, data);
        const message = t(resData.i18nKey) || resData.message;
        message && toast.success(message);
        onSuccess?.(resData);
        return resData;
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
