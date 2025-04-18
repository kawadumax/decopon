import {
  Direction,
  StackCmdType,
  type StackCommand,
  StackView,
  StackViewList,
  StackViewPanel,
} from "@/components/StackView";
import { TagHeader } from "@/components/TagHeader";
import { TaskTree } from "@/components/TaskTree";
import { Timer } from "@/components/Timer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDeviseSize } from "@/hooks/useDeviseSize";
import { useState } from "react";
import { TaskSideView } from "./partials/TaskSideView";
import { TaskTagList } from "./partials/TaskTagList";
import { TaskTools } from "./partials/TaskTools";

export default function Index() {
  const deviseSize = useDeviseSize();
  if (deviseSize === "mobile") {
    return <MobileLayout />;
  }
  if (deviseSize === "tablet") {
    return <TabletLayout />;
  }
  return <PCLayout />;
}

const PCLayout = () => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row bg-white"
    >
      <ResizablePanel defaultSize={17.2}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel
            defaultSize={50}
            className="hidden-scrollbar flex flex-col justify-start overflow-scroll shadow-xs dark:bg-gray-800"
          >
            <TaskTagList />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel className="max-h-full shadow-xs dark:bg-gray-800">
            <Timer />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={41.4}
        className="hidden-scrollbar max-h-full overflow-auto shadow-xs dark:bg-gray-800"
      >
        <TaskTools />
        <TagHeader />
        <TaskTree />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel className="max-h-full overflow-hidden shadow-xs dark:bg-gray-800">
        <TaskSideView />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const TabletLayout = () => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row bg-white"
    >
      <ResizablePanel
        defaultSize={50}
        className="hidden-scrollbar max-h-full overflow-auto shadow-xs dark:bg-gray-800"
      >
        <TaskTools />
        <TagHeader />
        <TaskTree />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel className="max-h-full overflow-hidden shadow-xs dark:bg-gray-800">
        <TaskSideView />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

const MobileLayout = () => {
  const [command, setCommand] = useState<StackCommand>({
    type: StackCmdType.Push,
    to: "default",
    direction: Direction.None,
  });

  return (
    <div className="flex min-h-full flex-col bg-white">
      <button
        type="button"
        onClick={() => {
          setCommand({
            type: StackCmdType.Push,
            to: "detail",
            direction: Direction.Left,
          });
        }}
      >
        detail
      </button>
      <button
        type="button"
        onClick={() => {
          setCommand({
            type: StackCmdType.Pop,
          });
        }}
      >
        default
      </button>
      <div className="hidden-scrollbar flex max-h-full flex-1 flex-col overflow-auto shadow-xs dark:bg-gray-800">
        <StackView command={command}>
          <StackViewList>
            <StackViewPanel panelId="default" className="size-full bg-white">
              <TaskTools />
              <TagHeader />
              <TaskTree />
            </StackViewPanel>
            <StackViewPanel panelId="detail" className="size-full bg-white">
              <TaskSideView />
            </StackViewPanel>
          </StackViewList>
        </StackView>
      </div>
    </div>
  );
};
