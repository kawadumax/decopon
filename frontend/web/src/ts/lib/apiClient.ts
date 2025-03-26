import axiosInstance from "@/lib/axios";
import type { ApiData } from "@/types/index.d";
import axios from "axios";
import nProgress from "nprogress";

export async function callApi(
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: ApiData,
) {
  nProgress.start();
  console.log("ngress start");
  try {
    const response = await axiosInstance({ method, url, data });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw error;
    }
    throw error;
  } finally {
    nProgress.done();
    console.log("ngress done");
  }
}
