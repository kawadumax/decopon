import type { Tag, TagCheckable, TagWithCheck } from "@/scripts/types";
import { create } from "zustand";
import { queryClient } from "../queries";

const tagCheckMap = new Map<number, boolean>();

interface TagStore {
  currentTag?: Tag;
  tagChecks: TagWithCheck[];
  setCurrentTag: (tag?: Tag) => void;
  addTagChecks: (tags: TagWithCheck[]) => void;
  resetTagChecks: () => void;
  getCheckableTags: () => TagCheckable[];
}

export const useTagStore = create<TagStore>((set, get) => ({
  currentTag: undefined,
  tagChecks: [],
  setCurrentTag: (tag) => set({ currentTag: tag }),
  addTagChecks: (tags) =>
    set((state) => {
      const filtered = state.tagChecks.filter(
        (v) => !tags.some((nv) => nv.id === v.id),
      );
      const next = [...filtered, ...tags];
      for (const t of tags) {
        tagCheckMap.set(t.id, t.checked);
      }
      return { tagChecks: next };
    }),
  resetTagChecks: () => {
    tagCheckMap.clear();
    set({ tagChecks: [] });
  },
  getCheckableTags: () => {
    const tags = queryClient.getQueryData<Tag[]>(["tags"]) ?? [];
    const tagChecks = get().tagChecks;
    tagCheckMap.clear();
    for (const c of tagChecks) {
      tagCheckMap.set(c.id, c.checked);
    }
    return tags.map((tag) => ({
      ...tag,
      checked: tagCheckMap.get(tag.id) ?? false,
    }));
  },
}));
