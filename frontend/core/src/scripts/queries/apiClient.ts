import type { ApiData } from "@/scripts/types/index.d";
import { NProgressManager } from "@lib/nProgressManager";
import axios from "axios";
import axiosInstance from "./axios";

const progressManager = NProgressManager.getInstance();

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
