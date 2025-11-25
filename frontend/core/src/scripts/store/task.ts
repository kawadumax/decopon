import { useTaskById } from "./taskRepository";
import { create } from "zustand";

interface TaskStore {
  currentTaskId?: number;
  setCurrentTaskId: (taskId?: number) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  currentTaskId: undefined,
  setCurrentTaskId: (taskId) => set({ currentTaskId: taskId }),
}));

export const useCurrentTask = () => {
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  return useTaskById(currentTaskId);
};
