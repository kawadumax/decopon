import type { Task } from "@/scripts/types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type TaskListKey = string;

const allTasksKey = "all";

const toListKey = (tagId?: number): TaskListKey =>
  tagId === undefined ? allTasksKey : `tag:${tagId}`;

interface TaskRepositoryState {
  tasksById: Record<number, Task>;
  taskLists: Record<TaskListKey, number[]>;
  setTasksForFilter: (tagId: number | undefined, tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  updateTask: (taskId: number, patch: Partial<Task>) => void;
  removeTask: (taskId: number) => void;
  addTaskToList: (tagId: number | undefined, taskId: number) => void;
  appendTagToTask: (taskId: number, tag: Task["tags"][number]) => void;
  removeTagFromTask: (taskId: number, matcher: { id?: number; name?: string }) => void;
}

export const useTaskRepository = create<TaskRepositoryState>()(
  immer((set) => ({
    tasksById: {},
    taskLists: {},
    setTasksForFilter: (tagId, tasks) =>
      set((state) => {
        for (const task of tasks) {
          state.tasksById[task.id] = task;
        }
        state.taskLists[toListKey(tagId)] = tasks.map((task) => task.id);
      }),
    upsertTask: (task) =>
      set((state) => {
        state.tasksById[task.id] = task;
      }),
    updateTask: (taskId, patch) =>
      set((state) => {
        const existing = state.tasksById[taskId];
        if (!existing) return;
        state.tasksById[taskId] = { ...existing, ...patch };
      }),
    removeTask: (taskId) =>
      set((state) => {
        delete state.tasksById[taskId];
        for (const key of Object.keys(state.taskLists)) {
          state.taskLists[key] = state.taskLists[key].filter((id) => id !== taskId);
        }
      }),
    addTaskToList: (tagId, taskId) =>
      set((state) => {
        const key = toListKey(tagId);
        const list = state.taskLists[key];
        if (!list) {
          state.taskLists[key] = [taskId];
          return;
        }
        if (!list.includes(taskId)) {
          list.push(taskId);
        }
      }),
    appendTagToTask: (taskId, tag) =>
      set((state) => {
        const existing = state.tasksById[taskId];
        if (!existing) return;
        const tags = existing.tags ?? [];
        state.tasksById[taskId] = {
          ...existing,
          tags: [...tags, tag],
        };
      }),
    removeTagFromTask: (taskId, matcher) =>
      set((state) => {
        const existing = state.tasksById[taskId];
        if (!existing || !existing.tags) return;
        const shouldRemove = (tag: NonNullable<Task["tags"]>[number]) => {
          if (matcher.id !== undefined) {
            return tag.id === matcher.id;
          }
          if (matcher.name !== undefined) {
            return tag.name === matcher.name;
          }
          return false;
        };
        state.tasksById[taskId] = {
          ...existing,
          tags: existing.tags.filter((tag) => !shouldRemove(tag)),
        };
      }),
  })),
);

export const useTasksByFilter = (tagId?: number) =>
  useTaskRepository((state) => {
    const ids = state.taskLists[toListKey(tagId)] ?? [];
    return ids.map((id) => state.tasksById[id]).filter(Boolean);
  });

export const useTaskById = (taskId?: number) =>
  useTaskRepository((state) =>
    taskId === undefined ? undefined : state.tasksById[taskId],
  );
