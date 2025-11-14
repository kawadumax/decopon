import { TagService } from "@/scripts/api/services/TagService";
import type { Tag } from "@/scripts/types";
import { logger, toEmblorTags } from "@lib/utils";
import { setTags } from "@/scripts/queries";
import { type Tag as EmblorTag, TagInput } from "emblor";
import { useCallback, useEffect, useState } from "react";
import { useCurrentTask } from "@store/task";
import { useTaskRepository } from "@store/taskRepository";
import { useQueryClient } from "@tanstack/react-query";

export const TaskEditableTagList = () => {
  const queryClient = useQueryClient();
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const currentTask = useCurrentTask();
  const [emblorTags, setEmblorTags] = useState<EmblorTag[]>(
    toEmblorTags(currentTask?.tags ?? []),
  );
  const { appendTagToTask, removeTagFromTask } = useTaskRepository.getState();

  const handleTagAdded = useCallback(
    (tagText: string) => {
      if (!currentTask) return;
      TagService.relation({
        task_id: currentTask.id,
        name: tagText,
      })
        .then((newTag) => {
          setTags((prev: Tag[] = []) => {
            const exists = prev.find((tag) => tag.id === newTag.id);
            if (exists) {
              return prev.map((tag) => (tag.id === newTag.id ? newTag : tag));
            }
            return [newTag, ...prev];
          });
          appendTagToTask(currentTask.id, newTag);
          return queryClient.invalidateQueries({ queryKey: ["tasks"] });
        })
        .catch((error) => {
          logger("failed to add tag relation", error);
        });
    },
    [appendTagToTask, currentTask, queryClient, setTags],
  );

  const handleTagRemoved = useCallback(
    (tagText: string) => {
      if (!currentTask) return;
      logger("tag removed", tagText, currentTask);
      TagService.relationDestroy({
        task_id: currentTask.id,
        name: tagText,
      })
        .then((tag) => {
          if (tag) {
            setTags((prev: Tag[] = []) =>
              prev.map((t) => (t.id === tag.id ? tag : t)),
            );
            removeTagFromTask(currentTask.id, { id: tag.id });
          } else {
            removeTagFromTask(currentTask.id, { name: tagText });
          }
          return queryClient.invalidateQueries({ queryKey: ["tasks"] });
        })
        .catch((error) => {
          logger("failed to remove tag relation", error);
        });
    },
    [currentTask, queryClient, removeTagFromTask, setTags],
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
