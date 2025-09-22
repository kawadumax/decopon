import type { ApiRequestData, Task } from "@/scripts/types";
import { endpoints } from "../endpoints";
import { callApi } from "../httpClient";

export const TaskService = {
  index(): Promise<Task[]> {
    return callApi<Task[]>("get", endpoints.tasks.index);
  },
  indexByTags(tagIds: number[]): Promise<Task[]> {
    const params = new URLSearchParams();
    for (const id of tagIds) {
      params.append("tag_ids", id.toString());
    }
    const query = params.toString();
    return callApi<Task[]>("get", `${endpoints.tasks.index}?${query}`);
  },
  store(data: ApiRequestData): Promise<Task> {
    return callApi<Task>("post", endpoints.tasks.store, data, {
      toast: {
        success: "api.task.store",
        error: "api.task.store",
      },
    });
  },
  update(id: number, data: ApiRequestData): Promise<Task> {
    return callApi<Task>("put", endpoints.tasks.update(id), data, {
      toast: {
        success: "api.task.update",
        error: "api.task.update",
      },
    });
  },
  destroy(id: number): Promise<void> {
    return callApi<void>("delete", endpoints.tasks.destroy(id), undefined, {
      toast: {
        success: "api.task.destroy",
        error: "api.task.destroy",
      },
    });
  },
  updateComplete(id: number, data: { completed: boolean }): Promise<Task> {
    return callApi<Task>("put", endpoints.tasks.update(id), data, {
      toast: {
        success: "api.task.updateCompletion",
        error: "api.task.updateCompletion",
      },
    });
  },
  updateTags(_id: number, _data: ApiRequestData): Promise<void> {
    // TODO: バックエンド実装後に有効化
    return Promise.resolve();
  },
};
