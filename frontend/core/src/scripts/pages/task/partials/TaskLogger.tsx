import { callApi } from "@/scripts/queries/apiClient";
import type { Log, Task } from "@/scripts/types";
import { LogInput } from "@components/LogInput";
import { LogItem } from "@components/LogItem";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { useEffect, useRef } from "react";
import { route } from "ziggy-js";

export const TaskLogger = ({ taskAtom }: { taskAtom: PrimitiveAtom<Task> }) => {
  const task = useAtomValue(taskAtom);
  const { data, isLoading } = useQuery<Log[]>({
    queryKey: ["logs", task?.id],
    queryFn: async () => {
      if (!task) return [];
      // const response = await api.get(route("api.logs.task", task.id));
      const response = await callApi("get", route("api.logs.task", task.id));
      return response ?? [];
    },
    enabled: !!task,
  });

  const logContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ul ref={logContainerRef} className="flex-1 overflow-y-auto">
        {data?.map((log) => (
          <LogItem key={log.id} log={log} />
        ))}
      </ul>
      <LogInput task={task} />
    </div>
  );
};
