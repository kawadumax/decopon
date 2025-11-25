import type { Log } from "@/scripts/types";
import { LogInput } from "@components/LogInput";
import { LogItem } from "@components/LogItem";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useCurrentTask } from "@store/task";
import { fetchTaskLogsQueryOptions } from "@/scripts/queries";

export const TaskLogger = () => {
  const task = useCurrentTask();
  const { data = [], isLoading } = useQuery<Log[]>(
    fetchTaskLogsQueryOptions(task?.id),
  );

  const logContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop =
        logContainerRef.current.scrollHeight;
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ul ref={logContainerRef} className="flex-1 overflow-y-auto">
        {data?.map((log: Log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </ul>
      <LogInput task={task} />
    </div>
  );
};
