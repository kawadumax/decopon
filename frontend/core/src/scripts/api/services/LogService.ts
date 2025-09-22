import type { ApiRequestData, Log } from "@/scripts/types";
import { endpoints } from "../endpoints";
import { callApi } from "../httpClient";

export const LogService = {
  index(): Promise<Log[]> {
    return callApi<Log[]>("get", endpoints.logs.index);
  },
  store(data: ApiRequestData): Promise<Log> {
    return callApi<Log>("post", endpoints.logs.store, data);
  },
  task(id: number): Promise<Log[]> {
    return callApi<Log[]>("get", endpoints.logs.task(id));
  },
};
