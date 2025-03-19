import axiosInstance from "@/lib/axios";
import type { ApiData } from "@/types/index.d";
import axios from "axios";

export async function callApi(
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: ApiData,
) {
  try {
    const response = await axiosInstance({ method, url, data });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 必要ならここでエラーログやエラーメッセージの加工を実施
      throw error;
    }
    throw error;
  }
}
