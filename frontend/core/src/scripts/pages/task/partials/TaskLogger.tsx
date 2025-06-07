import { LogInput } from "@/scripts/components/LogInput";
import type { Log, Task } from "@/scripts/types";
import { LogItem } from "@components/LogItem";
import { useApi } from "@hooks/useApi";
import { logger } from "@lib/utils";
import { useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { route } from "ziggy-js";

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
  const api = useApi();
  const task = useAtomValue(taskAtom);
  const [logs, setLogs] = useState<Log[]>([]);

  const logContainerRef = useRef<HTMLUListElement>(null);

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
      {/* <div className="pt-4">
        <AutosizeTextarea
          ref={textareaRef}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          defaultValue={content}
          maxHeight={200}
          minHeight={0}
        />
      </div> */}
      <LogInput />
    </div>
  );
};
