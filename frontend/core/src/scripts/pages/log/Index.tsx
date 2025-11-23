import { LogInput } from "@/scripts/components/LogInput";
import type { Log } from "@/scripts/types";
import { Loading } from "@components/Loading";
import { LogItem } from "@components/LogItem";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { useQuery } from "@tanstack/react-query";
import { fetchLogsQueryOptions } from "@/scripts/queries";
import { useEffect, useRef } from "react";
import type React from "react";
import { LogTagList } from "./partials/LogTagList";
import { LogTaskFilter } from "./partials/LogTaskFilter";
import { useLogFilterStore } from "@store/log";
import { useLogList } from "@store/logRepository";

const LogList = ({
  logs,
  logContainerRef,
}: { logs: Log[]; logContainerRef: React.RefObject<HTMLUListElement> }) => {
  useEffect(() => {
    const element = logContainerRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [logContainerRef, logs.length, logs[logs.length - 1]?.id]);

  return (
    <ul
      ref={logContainerRef}
      className="flex-1 overflow-y-auto bg-surface dark:bg-surface-inverse"
    >
      {logs?.map((log) => (
        <LogItem key={log.id} log={log} />
      ))}
    </ul>
  );
};

const ResizableLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row divide-x divide-line bg-surface dark:divide-line-subtle dark:bg-surface-inverse"
    >
      {children}
    </ResizablePanelGroup>
  );
};

const TwoPaneLayout = ({
  logs,
  logContainerRef,
  leftPanel,
  rightPadding = "p-4",
}: {
  logs: Log[];
  logContainerRef: React.RefObject<HTMLUListElement>;
  leftPanel: React.ReactNode;
  rightPadding?: string;
}) => {
  return (
    <ResizableLayout>
      <ResizablePanel
        defaultSize={20}
        className="bg-surface-muted dark:bg-surface-inverse border-r border-line dark:border-line-subtle"
      >
        {leftPanel}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        className={`h-full bg-surface dark:bg-surface-inverse ${rightPadding}`}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
          <LogTaskFilter />
          <div className="flex min-h-0 flex-1">
            <LogList logs={logs} logContainerRef={logContainerRef} />
          </div>
          <LogInput task={undefined} />
        </div>
      </ResizablePanel>
    </ResizableLayout>
  );
};

const PCLayout = ({
  logs,
  logContainerRef,
}: {
  logs: Log[];
  logContainerRef: React.RefObject<HTMLUListElement>;
}) => {
  return (
    <TwoPaneLayout
      logs={logs}
      logContainerRef={logContainerRef}
      leftPanel={<LogTagList />}
      rightPadding="p-4"
    />
  );
};

const TabletLayout = ({
  logs,
  logContainerRef,
}: {
  logs: Log[];
  logContainerRef: React.RefObject<HTMLUListElement>;
}) => {
  return (
    <TwoPaneLayout
      logs={logs}
      logContainerRef={logContainerRef}
      leftPanel={<LogTagList />}
      rightPadding="p-3"
    />
  );
};

const MobileLayout = ({
  logs,
  logContainerRef,
}: {
  logs: Log[];
  logContainerRef: React.RefObject<HTMLUListElement>;
}) => {
  return (
    <div className="flex min-h-full flex-col bg-surface dark:bg-surface-inverse">
      <div className="shadow-xs dark:bg-surface-inverse">
        <LogTagList />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
        <LogTaskFilter />
        <div className="flex min-h-0 flex-1">
          <LogList logs={logs} logContainerRef={logContainerRef} />
        </div>
      </div>

      <div className="sticky bottom-0 border-line border-t bg-surface px-4 pb-4 pt-2 dark:border-line-subtle dark:bg-surface-inverse">
        <LogInput task={undefined} />
      </div>
    </div>
  );
};

export default function Index() {
  const logContainerRef = useRef<HTMLUListElement>(null);
  const selectedTagIds = useLogFilterStore((state) => state.selectedTagIds);
  const selectedTaskId = useLogFilterStore((state) => state.selectedTaskId);
  const taskName = useLogFilterStore((state) => state.taskName);
  const logsQueryOptions = fetchLogsQueryOptions({
    tagIds: selectedTagIds,
    taskId: selectedTaskId ?? undefined,
    taskName: taskName || undefined,
  });
  useQuery(logsQueryOptions);
  const logs = useLogList({
    tagIds: selectedTagIds,
    taskId: selectedTaskId ?? undefined,
    taskName: taskName || undefined,
  });
  const deviceSize = useDeviceSize();

  if (deviceSize === undefined) {
    return <Loading />;
  }

  const layouts = {
    pc: PCLayout,
    tablet: TabletLayout,
    mobile: MobileLayout,
  } as const;
  const Layout = deviceSize ? layouts[deviceSize] : undefined;

  return Layout ? (
    <Layout logs={logs} logContainerRef={logContainerRef} />
  ) : (
    <Loading />
  );
}
