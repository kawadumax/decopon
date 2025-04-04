import { LogItem } from "@/components/LogItem";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { logsAtom } from "@/lib/atoms";
import type { Log, PageProps } from "@/types";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { LogTagList } from "./partials/LogTagList";

export default function Index(
  props: PageProps<{
    logs: Log[];
  }>,
) {
  const logContainerRef = useRef<HTMLUListElement>(null);
  const [logs, setLogs] = useAtom(logsAtom);
  useEffect(() => {
    setLogs(props.logs);
  }, [props.logs, setLogs]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row bg-white"
    >
      <ResizablePanel defaultSize={17.2}>
        <LogTagList />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <ul ref={logContainerRef} className="flex-1 overflow-y-auto">
          {logs?.map((log) => (
            <LogItem key={log.id} log={log} />
          ))}
        </ul>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
