import { LogService } from "@/scripts/api/services/LogService";
import type { Log } from "@/scripts/types";
import { LogInput } from "@components/LogInput";
import { LogItem } from "@components/LogItem";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTaskStore } from "@store/task";

export const TaskLogger = () => {
  const task = useTaskStore((s) => s.currentTask);
  const { data, isLoading } = useQuery<Log[]>({
    queryKey: ["logs", task?.id],
    queryFn: async () => {
      if (!task) return [];
      const response = await LogService.task(task.id);
      return response ?? [];
    },
    enabled: !!task,
  });

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
