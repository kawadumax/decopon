import { create } from "zustand";

const normalizeIds = (ids: number[]) => {
  const unique = Array.from(new Set(ids));
  unique.sort((a, b) => a - b);
  return unique;
};

interface LogFilterStore {
  selectedTagIds: number[];
  selectedTaskId: number | null;
  taskName: string;
  toggleTag: (tagId: number) => void;
  setSelectedTagIds: (tagIds: number[]) => void;
  clearTags: () => void;
  setTaskFilter: (taskId: number | null, taskName: string) => void;
  clearTaskFilter: () => void;
}

export const useLogFilterStore = create<LogFilterStore>((set) => ({
  selectedTagIds: [],
  selectedTaskId: null,
  taskName: "",
  toggleTag: (tagId) =>
    set((state) => {
      const exists = state.selectedTagIds.includes(tagId);
      const next = exists
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId];
      return { selectedTagIds: normalizeIds(next) };
    }),
  setSelectedTagIds: (tagIds) =>
    set({ selectedTagIds: normalizeIds(tagIds) }),
  clearTags: () => set({ selectedTagIds: [] }),
  setTaskFilter: (taskId, taskName) =>
    set({
      selectedTaskId: taskId,
      taskName: taskName.trim(),
    }),
  clearTaskFilter: () => set({ selectedTaskId: null, taskName: "" }),
}));
