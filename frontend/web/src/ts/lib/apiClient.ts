import axiosInstance from "@/lib/axios";
import type { ApiData } from "@/types/index.d";
import axios from "axios";
import { NProgressManager } from "./nProgressManager";

const progressManager = new NProgressManager();

export async function callApi(
  method: "get" | "post" | "put" | "delete",
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
