import { LogItem } from "@/components/LogItem";
import {} from "@/components/StackView";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import { logsAtom } from "@/lib/atoms";
import type { Log, PageProps } from "@/types";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { LogTagList } from "./partials/LogTagList";

const LogList = ({
  logs,
  logContainerRef,
}: { logs: Log[]; logContainerRef: React.RefObject<HTMLUListElement> }) => {
  return (
    <ul ref={logContainerRef} className="flex-1 overflow-y-auto">
      {logs?.map((log) => (
        <LogItem key={log.id} log={log} />
      ))}
    </ul>
  );
};

const MobileLayout = ({
  logs,
  logContainerRef,
}: { logs: Log[]; logContainerRef: React.RefObject<HTMLUListElement> }) => {
  return <LogList logs={logs} logContainerRef={logContainerRef} />;
};

const PCLayout = ({
  logs,
  logContainerRef,
}: { logs: Log[]; logContainerRef: React.RefObject<HTMLUListElement> }) => {
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
        <LogList logs={logs} logContainerRef={logContainerRef} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default function Index(
  props: PageProps<{
    logs: Log[];
  }>,
) {
  const logContainerRef = useRef<HTMLUListElement>(null);
  const [logs, setLogs] = useAtom(logsAtom);
  const deviceSize = useDeviceSize();

  useEffect(() => {
    setLogs(props.logs);
  }, [props.logs, setLogs]);

  if (deviceSize === "mobile") {
    return <MobileLayout logs={logs} logContainerRef={logContainerRef} />;
  }

  return <PCLayout logs={logs} logContainerRef={logContainerRef} />;
}
