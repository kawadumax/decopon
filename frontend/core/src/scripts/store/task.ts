import type { Task } from "@/scripts/types";
import { create } from "zustand";

interface TaskStore {
  currentTask?: Task;
  setCurrentTask: (task?: Task) => void;
  updateCurrentTask: (id: Task["id"], task: Partial<Task>) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  currentTask: undefined,
  setCurrentTask: (task) => set({ currentTask: task }),
  updateCurrentTask: (id, task) =>
    set((state) =>
      state.currentTask?.id === id
        ? { currentTask: { ...state.currentTask, ...task } }
        : state,
    ),
}));

