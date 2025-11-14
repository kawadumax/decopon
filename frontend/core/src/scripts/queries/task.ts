import { TaskService } from "@/scripts/api/services/TaskService";
import { logger } from "@/scripts/lib/utils";
import type { Task, TaskStoreRequest } from "@/scripts/types";
import { useMutation, useQuery, type MutationOptions } from "@tanstack/react-query";

import { useTaskStore } from "../store/task";
import {
  useTaskRepository,
  useTasksByFilter,
} from "../store/taskRepository";
import { queryClient } from "./index";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (tagId?: number) =>
    tagId !== undefined ? (["tasks", tagId] as const) : (["tasks"] as const),
  detail: (taskId: number) => ["tasks", "detail", taskId] as const,
};

export type CreateTaskVariables = TaskStoreRequest &
  Partial<Pick<Task, "completed" | "tags" | "created_at" | "updated_at">>;

export type UpdateTaskVariables = {
  id: number;
  data: Partial<Task>;
};

export type ToggleCompleteVariables = {
  id: number;
  completed: boolean;
};

const invalidateTaskQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: taskKeys.all });
};

const invalidateTaskLogs = async (taskId: number) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["logs"] }),
    queryClient.invalidateQueries({ queryKey: ["logs", taskId] }),
  ]);
};

const resolveTagIds = (variables: CreateTaskVariables, tagId?: number) => {
  if (variables.tag_ids && variables.tag_ids.length > 0) {
    return variables.tag_ids;
  }
  if (variables.tags && variables.tags.length > 0) {
    return variables.tags.map((tag) => tag.id);
  }
  if (tagId !== undefined) {
    return [tagId];
  }
  return undefined;
};

export const tasksQueryOptions = (tagId?: number) => ({
  queryKey: taskKeys.list(tagId),
  queryFn: async (): Promise<Task[]> => {
    if (tagId !== undefined) {
      return await TaskService.indexByTags([tagId]);
    }
    return await TaskService.index();
  },
});

export const createTaskMutationOptions = (
  tagId?: number,
): MutationOptions<Task, unknown, CreateTaskVariables, unknown> => ({
  mutationFn: async (variables) => {
    const tag_ids = resolveTagIds(variables, tagId);
    const { tags: _tags, ...rest } = variables;
    return await TaskService.store({ ...rest, tag_ids });
  },
  mutationKey: ["tasks", "create", tagId],
  onSuccess: (task) => {
    const { upsertTask, addTaskToList } = useTaskRepository.getState();
    upsertTask(task);
    addTaskToList(undefined, task.id);
    if (tagId !== undefined) {
      addTaskToList(tagId, task.id);
    }
  },
  onError: (error) => {
    logger("Error adding task:", error);
  },
  onSettled: () => {
    void invalidateTaskQueries();
  },
});

export const deleteTaskMutationOptions = (): MutationOptions<
  void,
  unknown,
  number,
  unknown
> => ({
  mutationFn: async (taskId) => {
    await TaskService.destroy(taskId);
  },
  mutationKey: ["tasks", "delete"],
  onSuccess: (_data, taskId) => {
    const { removeTask } = useTaskRepository.getState();
    removeTask(taskId);
    const { currentTaskId, setCurrentTaskId } = useTaskStore.getState();
    if (currentTaskId === taskId) {
      setCurrentTaskId(undefined);
    }
  },
  onSettled: () => {
    void invalidateTaskQueries();
  },
});

export const updateTaskMutationOptions = (): MutationOptions<
  Task,
  unknown,
  UpdateTaskVariables,
  unknown
> => ({
  mutationFn: async ({ id, data }) => await TaskService.update(id, data),
  mutationKey: ["tasks", "update"],
  onSuccess: (task) => {
    const { upsertTask } = useTaskRepository.getState();
    upsertTask(task);
  },
  onError: () => {
    console.error("Failed to update task");
  },
});

export const toggleCompleteMutationOptions = (): MutationOptions<
  Task,
  unknown,
  ToggleCompleteVariables,
  unknown
> => ({
  mutationFn: async ({ id, completed }) =>
    await TaskService.updateComplete(id, { completed }),
  mutationKey: ["tasks", "toggleComplete"],
  onSuccess: (task) => {
    const { upsertTask } = useTaskRepository.getState();
    upsertTask(task);
    void invalidateTaskLogs(task.id);
  },
  onError: () => {
    console.error("Failed to update task completion");
  },
});

export const useTasks = (tagId?: number) => {
  return useQuery({
    ...tasksQueryOptions(tagId),
    onSuccess: (tasks) => {
      const { setTasksForFilter } = useTaskRepository.getState();
      setTasksForFilter(tagId, tasks);
    },
  });
};

export const useTaskList = (tagId?: number) => {
  return useTasksByFilter(tagId);
};

export const useTaskMutations = (tagId?: number) => {
  const createTask = useMutation(createTaskMutationOptions(tagId));
  const deleteTask = useMutation(deleteTaskMutationOptions());
  const updateTask = useMutation(updateTaskMutationOptions());
  const toggleComplete = useMutation(toggleCompleteMutationOptions());

  return { createTask, deleteTask, updateTask, toggleComplete };
};
