import {
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
import {} from "@/components/ui/tabs";
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
    to: "default",
    direction: "none",
    command: "push",
  });

  return (
    <div className="flex min-h-full flex-col bg-white">
      <button
        type="button"
        onClick={() => {
          setCommand({
            to: "detail",
            direction: "left",
            command: "push",
          });
        }}
      >
        detail
      </button>
      <button
        type="button"
        onClick={() => {
          setCommand({
            command: "pop",
          });
        }}
      >
        default
      </button>
      <div className="flex flex-1 flex-col">
        <div className="hidden-scrollbar max-h-full overflow-auto shadow-xs dark:bg-gray-800">
          <StackView command={command}>
            <StackViewList>
              <StackViewPanel key="default">
                <TaskTools />
                <TagHeader />
                <TaskTree />
              </StackViewPanel>
              <StackViewPanel key="detail">
                <TaskSideView />
              </StackViewPanel>
            </StackViewList>
          </StackView>
        </div>
      </div>
    </div>
  );
};
