import { logger, toEmblorTags } from "@lib/utils";
import {
  attachTagToTask,
  detachTagFromTask,
} from "@/scripts/queries";
import { type Tag as EmblorTag, TagInput } from "emblor";
import { useCallback, useEffect, useState } from "react";
import { useCurrentTask } from "@store/task";

export const TaskEditableTagList = () => {
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const currentTask = useCurrentTask();
  const [emblorTags, setEmblorTags] = useState<EmblorTag[]>(
    toEmblorTags(currentTask?.tags ?? []),
  );
  const handleTagAdded = useCallback(
    (tagText: string) => {
      if (!currentTask) return;
      attachTagToTask(currentTask.id, tagText)
        .catch((error) => {
          logger("failed to add tag relation", error);
        });
    },
    [currentTask],
  );

  const handleTagRemoved = useCallback(
    (tagText: string) => {
      if (!currentTask) return;
      logger("tag removed", tagText, currentTask);
      detachTagFromTask(currentTask.id, tagText)
        .catch((error) => {
          logger("failed to remove tag relation", error);
        });
    },
    [currentTask],
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
          body:
            "h-6 p-2 rounded bg-surface-muted text-fg dark:bg-surface dark:text-fg",
          closeButton:
            "p-1 pr-0 hover:text-primary-foreground dark:hover:text-primary",
        },
        inlineTagsContainer:
          "border-0 px-0 bg-surface-muted dark:bg-surface-muted",

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
