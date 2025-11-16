import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef, useState } from "react";
import { storeLogMutationOptions } from "../queries";
import { LogSource, type Log, type Task } from "../types";
import {
  type AutosizeTextAreaRef,
  AutosizeTextarea,
} from "./ui/autosize-textarea";

export const LogInput = ({
  task,
  queryKeyOverride,
}: {
  task: Task | undefined;
  queryKeyOverride?: QueryKey;
}) => {
  const taskId = task?.id;
  const queryKey = queryKeyOverride ?? (taskId ? ["logs", taskId] : ["logs"]);
  const [tempIdCounter, setTempIdCounter] = useState(0);
  const [content, setContent] = useState("");
  const textareaRef = useRef<AutosizeTextAreaRef>(null);
  const queryClient = useQueryClient();

  // useMutationでPOSTリクエストを管理
  const storeLogMutation = useMutation(storeLogMutationOptions);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!content.trim()) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const tempId = -1 - tempIdCounter; // 負の値を使用して一時的なIDを生成
      setTempIdCounter((prev) => prev + 1);
      const newLog: Log = {
        id: tempId,
        content,
        source: LogSource.User,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 0,
        task_id: taskId,
        tags: [],
      };

      queryClient.setQueryData<Log[]>(queryKey, (oldLogs) => [
        ...(oldLogs ?? []),
        newLog,
      ]);

      // ここでAPIにPOSTリクエストを送信
      storeLogMutation.mutate({
        content: content,
        task_id: taskId,
        source: LogSource.User,
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
