import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { buildLogsQueryKey, fetchTaskLogsQueryOptions, storeLogMutationOptions } from "../queries";
import { LogSource, type Log, type Tag, type Task } from "../types";
import {
  type AutosizeTextAreaRef,
  AutosizeTextarea,
} from "./ui/autosize-textarea";
import { extractTagsFromMarkdown } from "@/scripts/lib/markdown";
import { useLogFilterStore } from "@store/log";
import { useLogRepository } from "@store/logRepository";

export const LogInput = ({
  task,
  queryKeyOverride,
}: {
  task: Task | undefined;
  queryKeyOverride?: QueryKey;
}) => {
  const taskId = task?.id;
  const taskTags = useMemo(() => task?.tags ?? [], [task]);
  const taskTagIds = useMemo(
    () => taskTags.map((tag) => tag.id),
    [taskTags],
  );
  const [tempIdCounter, setTempIdCounter] = useState(0);
  const [content, setContent] = useState("");
  const textareaRef = useRef<AutosizeTextAreaRef>(null);
  const queryClient = useQueryClient();
  const selectedTagIds = useLogFilterStore((state) => state.selectedTagIds);
  const selectedTaskId = useLogFilterStore((state) => state.selectedTaskId);
  const taskName = useLogFilterStore((state) => state.taskName);
  const effectiveTaskId = taskId ?? selectedTaskId ?? undefined;
  const cachedTags = queryClient.getQueryData<Tag[]>(["tags"]) ?? [];
  const tagMap = useMemo(() => {
    const map = new Map<string, Tag>();
    for (const tag of cachedTags) {
      map.set(tag.name.toLowerCase(), tag);
    }
    return map;
  }, [cachedTags]);
  const tagIdMap = useMemo(() => {
    const map = new Map<number, Tag>();
    for (const tag of cachedTags) {
      map.set(tag.id, tag);
    }
    for (const tag of taskTags) {
      map.set(tag.id, tag);
    }
    return map;
  }, [cachedTags, taskTags]);

  const repositoryParams = useMemo(
    () => ({
      tagIds: selectedTagIds,
      taskId: effectiveTaskId,
      taskName: taskName || undefined,
    }),
    [selectedTagIds, selectedTaskId, taskName, effectiveTaskId],
  );
  const logsQueryKey = useMemo<QueryKey>(() => {
    if (queryKeyOverride) return queryKeyOverride;
    if (taskId) return fetchTaskLogsQueryOptions(taskId).queryKey as QueryKey;
    return buildLogsQueryKey(repositoryParams);
  }, [queryKeyOverride, taskId, repositoryParams]);

  // useMutationでPOSTリクエストを管理
  const storeLogMutation = useMutation({
    ...storeLogMutationOptions,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: logsQueryKey });
      if (storeLogMutationOptions.onSuccess) {
        await storeLogMutationOptions.onSuccess(data, variables, context);
      }
    },
  });

  const buildTagPayload = useCallback(
    (body: string) => {
      const extracted = extractTagsFromMarkdown(body);
      const mergedIds = new Set<number>([...selectedTagIds, ...taskTagIds]);
      const tagNames = new Set<string>();
      for (const name of extracted) {
        const normalized = name.toLowerCase();
        const tag = tagMap.get(normalized);
        if (tag) {
          mergedIds.add(tag.id);
        } else {
          tagNames.add(name);
        }
      }
      return {
        tag_ids: Array.from(mergedIds),
        tag_names: Array.from(tagNames),
      };
    },
    [selectedTagIds, tagMap, taskTagIds],
  );

  const resolveTagsByIds = useCallback(
    (ids: number[]) =>
      ids
        .map((id) => tagIdMap.get(id))
        .filter((tag): tag is Tag => Boolean(tag)),
    [tagIdMap],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!content.trim()) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const tagPayload = buildTagPayload(content);
      const tempId = -1 - tempIdCounter; // 負の値を使用して一時的なIDを生成
      setTempIdCounter((prev) => prev + 1);
      const newLog: Log = {
        id: tempId,
        content,
        source: LogSource.User,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 0,
        task_id: effectiveTaskId,
        tags: resolveTagsByIds(tagPayload.tag_ids),
      };

      const { addLogToList, upsertLog } = useLogRepository.getState();
      upsertLog(newLog);
      addLogToList(repositoryParams, newLog.id);

      queryClient.setQueryData<Log[]>(logsQueryKey, (oldLogs) => [
        ...(oldLogs ?? []),
        newLog,
      ]);

      // ここでAPIにPOSTリクエストを送信
      storeLogMutation.mutate({
        content: content,
        task_id: effectiveTaskId,
        source: LogSource.User,
        ...tagPayload,
      } as Partial<Log>);

      setContent("");
      event.currentTarget.value = "";

      // トリガーリサイズを呼び出す
      if (textareaRef.current) {
        textareaRef.current.triggerResize();
      }
    }
  };

  const handleInput = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setContent(event.currentTarget.value);
  };

  return (
    <div className="pt-4">
      <AutosizeTextarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        defaultValue={content}
        maxHeight={200}
        minHeight={0}
      />
    </div>
  );
};
