import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { route } from "ziggy-js";
import { useApi } from "../hooks/useApi";
import { logger } from "../lib/utils";
import type { Log, Task } from "../types";
import {
  type AutosizeTextAreaRef,
  AutosizeTextarea,
} from "./ui/autosize-textarea";

export const LogInput = ({ task }: { task: Task | undefined }) => {
  const taskId = task?.id ?? "undefined";
  const queryKey = task ? ["logs", taskId] : ["logs"];
  const api = useApi();
  const [tempIdCounter, setTempIdCounter] = useState(0);
  const [content, setContent] = useState("");
  const textareaRef = useRef<AutosizeTextAreaRef>(null);
  const queryClient = useQueryClient();

  // useMutationでPOSTリクエストを管理
  const mutation = useMutation({
    mutationFn: (data: Partial<Log>) => api.post(route("api.logs.store"), data),
    onSuccess: (storedLog) => {
      logger("success log storing", storedLog);
      // ログ一覧のキャッシュを無効化（必要に応じて）
      queryClient.invalidateQueries({
        queryKey,
      });
    },
    onError: (error) => {
      logger("error log storing", error);
    },
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!content.trim()) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const tempId = -1 - tempIdCounter; // 負の値を使用して一時的なIDを生成
      setTempIdCounter((prev) => prev + 1);
      const newLog = {
        id: tempId,
        content,
        created_at: new Date().toISOString(),
        user_id: null,
        task_id: taskId,
        updated_at: null,
      } as unknown as Log;

      queryClient.setQueryData<Log[]>(queryKey, (oldLogs) => [
        ...(oldLogs ?? []),
        newLog,
      ]);

      // ここでAPIにPOSTリクエストを送信
      mutation.mutate({
        content: content,
        task_id: taskId ?? null,
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
