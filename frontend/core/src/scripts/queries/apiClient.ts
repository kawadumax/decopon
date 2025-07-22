import type { ApiRequestData, Auth, Log, User } from "@/scripts/types/index.d";
import { NProgressManager } from "@lib/nProgressManager";
import axios from "axios";
import { t } from "i18next";
import { toast } from "sonner";
import { route } from "ziggy-js";
import { logger } from "../lib/utils";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    if (
      ["post", "put", "delete", "patch"].includes(
        config.method?.toLowerCase() || "",
      )
    ) {
      if (!document.cookie.includes("XSRF-TOKEN")) {
        // 同じインスタンスを使用してCSRFトークンを取得
        // Get 以外を行うと無限ループなので注意
        await axiosInstance.get("/sanctum/csrf-cookie");
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const progressManager = NProgressManager.getInstance();

// APIを呼び出すための汎用関数
export async function callApi(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  requestData?: ApiRequestData,
) {
  try {
    progressManager.incrementRequests();
    const response = await axiosInstance({ method, url, data: requestData });
    const data = response.data;
    const message = t(data.i18nKey) || data.message;
    message && toast.success(message);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        t(error.response?.data.i18nKey) || error.response?.data.message;
      message && toast.error(message);
      throw error;
    }
    throw error;
  } finally {
    progressManager.decrementRequests();
  }
}

export const fetchAuth = async (): Promise<Auth> => {
  try {
    // APIからユーザーデータを取得
    const user: User = await callApi("get", route("get-user"));
    return { user };
  } catch (error) {
    logger("Failed to fetch user data:", error);
    // エラーが発生した場合は、ユーザーをundefinedとして返す
    return { user: undefined };
  }
};

export const storeLog = async (data: Partial<Log>): Promise<Log> => {
  return callApi("post", route("api.logs.store"), data);
};
