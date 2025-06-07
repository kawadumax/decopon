import { useRef, useState } from "react";
import { route } from "ziggy-js";
import { useApi } from "../hooks/useApi";
import { logger } from "../lib/utils";
import type { Log } from "../types";
import {
  type AutosizeTextAreaRef,
  AutosizeTextarea,
} from "./ui/autosize-textarea";

export const LogInput = () => {
  const api = useApi();
  const [tempIdCounter, setTempIdCounter] = useState(0);
  const [content, setContent] = useState("");
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
