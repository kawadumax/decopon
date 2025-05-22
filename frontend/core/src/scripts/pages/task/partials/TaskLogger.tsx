import { LogItem } from "@/components/LogItem";
import {
  type AutosizeTextAreaRef,
  AutosizeTextarea,
} from "@/components/ui/autosize-textarea";
import { useApi } from "@/hooks/useApi";
import type { Log, Task } from "@/types";
import { logger } from "@lib/utils";
import { useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
  const api = useApi();
  const task = useAtomValue(taskAtom);
  const [logs, setLogs] = useState<Log[]>([]);
  const [content, setContent] = useState("");
  const [tempIdCounter, setTempIdCounter] = useState(0);

  const logContainerRef = useRef<HTMLUListElement>(null);
  const textareaRef = useRef<AutosizeTextAreaRef>(null);

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
        task_id: task.id,
        updated_at: null,
      } as unknown as Log;
      setLogs((prev) => [...prev, newLog]);
      api.post(
        route("api.logs.store"),
        {
          content: content,
          task_id: task.id,
        } as Partial<Log>,
        (data) => {
          const storedLog = data;
          setLogs((prev) =>
            prev.map((log) =>
              log.id === tempId ? { ...log, ...storedLog } : log,
            ),
          );
          logger("success log storing", data);
        },
      );
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

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (task) {
      api.get(
        route("api.logs.task", task.id),
        (data) => {
          setLogs(data ?? []);
        },
        (error) => {
          logger("Error fetching logs:", error);
        },
      );
    }
  }, [task, api]);

  return (
    <div className="flex flex-1 flex-col">
      <ul ref={logContainerRef} className="flex-1 overflow-y-auto">
        {logs?.map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </ul>
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
    </div>
  );
};
