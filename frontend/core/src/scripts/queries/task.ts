import { TaskService } from "@/scripts/api/services/TaskService";
import { logger } from "@/scripts/lib/utils";
import type { Task, TaskStoreRequest } from "@/scripts/types";
import { useMutation, useQuery, type MutationOptions } from "@tanstack/react-query";

import { useTaskStore } from "../store/task";
import { queryClient } from "./index";

let temporaryTaskCounter = 0;
const nextTemporaryTaskId = () => -Date.now() - temporaryTaskCounter++;

export const taskKeys = {
  all: ["tasks"] as const,
  list: (tagId?: number) =>
    tagId !== undefined ? (["tasks", tagId] as const) : (["tasks"] as const),
  detail: (taskId: number) => ["tasks", "detail", taskId] as const,
};

type TaskListQueryKey = ReturnType<typeof taskKeys.list>;

type TaskListContext = {
  previousTasks?: Task[];
  queryKey: TaskListQueryKey;
};

type CreateTaskContext = TaskListContext & { tempId: number };

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

export const tasksQueryOptions = (tagId?: number) => ({
  queryKey: taskKeys.list(tagId),
  queryFn: async (): Promise<Task[]> => {
    if (tagId !== undefined) {
      return await TaskService.indexByTags([tagId]);
    }
    return await TaskService.index();
  },
  placeholderData: [] as Task[],
});

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

const buildOptimisticTask = (variables: CreateTaskVariables, tempId: number): Task => {
  const now = new Date().toISOString();
  return {
    id: tempId,
    title: variables.title,
    description: variables.description,
    completed: variables.completed ?? false,
    parent_task_id: variables.parent_task_id,
    created_at: variables.created_at ?? now,
    updated_at: variables.updated_at ?? now,
    tags: variables.tags,
  };
};

const updateTaskInCaches = (updatedTask: Task) => {
  const queries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
  for (const [key, tasks] of queries) {
    if (!tasks) continue;
    queryClient.setQueryData<Task[]>(key, tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }
};

const removeTaskFromCaches = (taskId: number) => {
  const queries = queryClient.getQueriesData<Task[]>({ queryKey: taskKeys.all });
  for (const [key, tasks] of queries) {
    if (!tasks) continue;
    queryClient.setQueryData<Task[]>(
      key,
      tasks.filter((task) => task.id !== taskId),
    );
  }
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

export const createTaskMutationOptions = (
  tagId?: number,
): MutationOptions<Task, unknown, CreateTaskVariables, CreateTaskContext> => ({
  mutationFn: async (variables) => {
    const tag_ids = resolveTagIds(variables, tagId);
    const { tags: _tags, ...rest } = variables;
    return await TaskService.store({ ...rest, tag_ids });
  },
  mutationKey: ["tasks", "create", tagId],
  onMutate: async (variables) => {
    const queryKey = taskKeys.list(tagId);
    await queryClient.cancelQueries({ queryKey });
    const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
    const tempId = nextTemporaryTaskId();
    const optimisticTask = buildOptimisticTask(variables, tempId);
    queryClient.setQueryData<Task[]>(queryKey, (old = []) => [...old, optimisticTask]);
    return { previousTasks, queryKey, tempId } satisfies CreateTaskContext;
  },
  onError: (error, _variables, context) => {
    logger("Error adding task:", error);
    if (context?.previousTasks) {
      queryClient.setQueryData(context.queryKey, context.previousTasks);
    }
  },
  onSuccess: (task, _variables, context) => {
    if (context) {
      queryClient.setQueryData<Task[]>(context.queryKey, (old = []) =>
        old.map((item) => (item.id === context.tempId ? task : item)),
      );
    }
  },
  onSettled: () => {
    void invalidateTaskQueries();
  },
});

export const deleteTaskMutationOptions = (
  tagId?: number,
): MutationOptions<void, unknown, number, TaskListContext> => ({
  mutationFn: async (taskId) => {
    await TaskService.destroy(taskId);
  },
  mutationKey: ["tasks", "delete", tagId],
  onMutate: async (taskId) => {
    const queryKey = taskKeys.list(tagId);
    await queryClient.cancelQueries({ queryKey });
    const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
    queryClient.setQueryData<Task[]>(queryKey, (old = []) => old.filter((task) => task.id !== taskId));
    return { previousTasks, queryKey } satisfies TaskListContext;
  },
  onSuccess: (_data, taskId, _context) => {
    removeTaskFromCaches(taskId);
  },
  onError: (_error, _taskId, context) => {
    if (context?.previousTasks) {
      queryClient.setQueryData(context.queryKey, context.previousTasks);
    }
  },
  onSettled: (_data, _error, taskId) => {
    void invalidateTaskQueries();
    const { currentTask, setCurrentTask } = useTaskStore.getState();
    if (currentTask?.id === taskId) {
      setCurrentTask(undefined);
    }
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
    updateTaskInCaches(task);
    useTaskStore.getState().updateCurrentTask(task.id, task);
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
    updateTaskInCaches(task);
    useTaskStore.getState().updateCurrentTask(task.id, {
      completed: task.completed,
    });
    void invalidateTaskLogs(task.id);
  },
  onError: () => {
    console.error("Failed to update task completion");
  },
});

export const useTasks = (tagId?: number) => {
  return useQuery(tasksQueryOptions(tagId));
};

export const useTaskMutations = (tagId?: number) => {
  const createTask = useMutation(createTaskMutationOptions(tagId));
  const deleteTask = useMutation(deleteTaskMutationOptions(tagId));
  const updateTask = useMutation(updateTaskMutationOptions());
  const toggleComplete = useMutation(toggleCompleteMutationOptions());

  return { createTask, deleteTask, updateTask, toggleComplete };
};
