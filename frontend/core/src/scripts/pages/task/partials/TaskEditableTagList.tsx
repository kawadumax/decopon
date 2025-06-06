import type { Task } from "@/scripts/types";
import { useApi } from "@hooks/useApi";
import { tagsAtom } from "@lib/atoms";
import { logger, toEmblorTags } from "@lib/utils";
import { type Tag as EmblorTag, TagInput } from "emblor";
import { useAtom, useSetAtom } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { route } from "ziggy-js";

export const TaskEditableTagList = ({
  taskAtom,
}: {
  taskAtom: PrimitiveAtom<Task>;
}) => {
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useAtom(taskAtom);
  const [emblorTags, setEmblorTags] = useState<EmblorTag[]>(
    toEmblorTags(currentTask.tags),
  );
  const setTags = useSetAtom(tagsAtom);
  const api = useApi();

  const handleTagAdded = useCallback(
    (tagText: string) => {
      api.post(
        route("api.tags.relation.post"),
        {
          task_id: currentTask.id,
          name: tagText,
        },
        (data) => {
          const newTag = data.tag;
          setTags((prev) => {
            // タグの名前で重複をチェック
            const isDuplicate = prev.some((tag) => tag.name === newTag.name);
            if (isDuplicate) {
              return prev; // 重複がある場合は既存の配列をそのまま返す
            }
            return [newTag, ...prev]; // 重複がない場合のみ新しいタグを追加
          });
          setCurrentTask((prev) => ({
            ...prev,
            tags: [...prev.tags, newTag],
          }));
        },
      );
    },
    [api, currentTask, setCurrentTask, setTags],
  );

  const handleTagRemoved = useCallback(
    (tagText: string) => {
      logger("tag removed", tagText, currentTask);
      api.delete(
        route("api.tags.relation.destroy"),
        {
          task_id: currentTask.id,
          name: tagText,
        },
        (data) => {
          setCurrentTask((prev) => {
            const newTags = prev.tags
              ? prev.tags.filter((tag) => tag.name !== data.tag.name)
              : [];
            return {
              ...prev,
              tags: [...newTags],
            };
          });
        },
      );
    },
    [currentTask, api, setCurrentTask],
  );

  useEffect(() => {
    setEmblorTags(toEmblorTags(currentTask.tags));
  }, [currentTask]);

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
