import type { ApiData, Auth } from "@/scripts/types/index.d";
import { NProgressManager } from "@lib/nProgressManager";
import axios from "axios";
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
  data?: ApiData,
) {
  try {
    progressManager.incrementRequests();
    const response = await axiosInstance({ method, url, data });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
    const user = await callApi("get", route("get-user"));
    return { user };
  } catch (error) {
    logger("Failed to fetch user data:", error);
    // エラーが発生した場合は、ユーザーをundefinedとして返す
    return { user: undefined };
  }
};
