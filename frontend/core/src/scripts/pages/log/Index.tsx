import { LogInput } from "@/scripts/components/LogInput";
import type { Log } from "@/scripts/types";
import { Loading } from "@components/Loading";
import { LogItem } from "@components/LogItem";
import {} from "@components/StackView";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { useQuery } from "@tanstack/react-query";
import { fetchLogsQueryOptions } from "@/scripts/queries";
import { useRef } from "react";
import { LogTagList } from "./partials/LogTagList";

const LogList = ({
  logs,
  logContainerRef,
}: { logs: Log[]; logContainerRef: React.RefObject<HTMLUListElement> }) => {
  return (
    <ul ref={logContainerRef} className="flex-1 overflow-y-auto bg-white">
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
      <ResizablePanel className="h-full p-4">
        <div className="flex h-full flex-1 flex-col">
          <LogList logs={logs} logContainerRef={logContainerRef} />
          <LogInput task={undefined} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default function Index() {
  const logContainerRef = useRef<HTMLUListElement>(null);
  const { data: logs = [] } = useQuery(fetchLogsQueryOptions);
  const deviceSize = useDeviceSize();

  if (deviceSize === undefined) {
    return <Loading />;
  }

  if (deviceSize === "mobile" || deviceSize === "tablet") {
    return <MobileLayout logs={logs} logContainerRef={logContainerRef} />;
  }

  return <PCLayout logs={logs} logContainerRef={logContainerRef} />;
}
