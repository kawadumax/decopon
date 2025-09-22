import { TagService } from "@/scripts/api/services/TagService";
import type { Tag } from "@/scripts/types";
import { logger, toEmblorTags } from "@lib/utils";
import { setTags } from "@/scripts/queries";
import { type Tag as EmblorTag, TagInput } from "emblor";
import { useCallback, useEffect, useState } from "react";
import { useTaskStore } from "@store/task";
import { useQueryClient } from "@tanstack/react-query";

export const TaskEditableTagList = () => {
  const queryClient = useQueryClient();
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const currentTask = useTaskStore((s) => s.currentTask);
  const setCurrentTask = useTaskStore((s) => s.setCurrentTask);
  const [emblorTags, setEmblorTags] = useState<EmblorTag[]>(
    toEmblorTags(currentTask?.tags ?? []),
  );

  const handleTagAdded = useCallback(
    (tagText: string) => {
      if (!currentTask) return;
      TagService.relation({
        task_id: currentTask.id,
        name: tagText,
      }).then((newTag) => {
        setTags((prev: Tag[] = []) => {
          const exists = prev.find((tag) => tag.id === newTag.id);
          if (exists) {
            return prev.map((tag) => (tag.id === newTag.id ? newTag : tag));
          }
          return [newTag, ...prev];
        });
        setCurrentTask({
          ...currentTask,
          tags: [...(currentTask.tags ?? []), newTag],
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      });
    },
    [currentTask, queryClient, setCurrentTask, setTags],
  );

  const handleTagRemoved = useCallback(
    (tagText: string) => {
      if (!currentTask) return;
      logger("tag removed", tagText, currentTask);
      TagService.relationDestroy({
        task_id: currentTask.id,
        name: tagText,
      }).then((tag) => {
        if (tag) {
          setTags((prev: Tag[] = []) =>
            prev.map((t) => (t.id === tag.id ? tag : t)),
          );
        }
        const newTags = currentTask.tags
          ? currentTask.tags.filter((t) => t.name !== tagText)
          : [];
        setCurrentTask({
          ...currentTask,
          tags: [...newTags],
        });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      });
    },
    [currentTask, queryClient, setCurrentTask, setTags],
  );

  useEffect(() => {
    setEmblorTags(toEmblorTags(currentTask?.tags ?? []));
  }, [currentTask]);

  if (!currentTask) return null;

  return (
    <TagInput
      placeholder="Add a tag"
      styleClasses={{
        input: "w-full shadow-none",
        tag: {
          body: "h-6 p-2",
          closeButton: "p-1 pr-0 hover:text-primary-foreground",
        },
        inlineTagsContainer: "border-0 px-0",
      }}
      tags={emblorTags}
      setTags={setEmblorTags}
      activeTagIndex={activeTagIndex}
      setActiveTagIndex={setActiveTagIndex}
      onTagAdd={handleTagAdded}
      onTagRemove={handleTagRemoved}
      size={"sm"}
      shape={"pill"}
      variant={"primary"}
    />
  );
};
