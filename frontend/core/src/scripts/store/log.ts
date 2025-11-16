import { create } from "zustand";

const normalizeIds = (ids: number[]) => {
  const unique = Array.from(new Set(ids));
  unique.sort((a, b) => a - b);
  return unique;
};

interface LogFilterStore {
  selectedTagIds: number[];
  toggleTag: (tagId: number) => void;
  setSelectedTagIds: (tagIds: number[]) => void;
  clearTags: () => void;
}

export const useLogFilterStore = create<LogFilterStore>((set) => ({
  selectedTagIds: [],
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
}));
