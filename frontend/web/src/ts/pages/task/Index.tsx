import { TagHeader } from "@/components/TagHeader";
import { TaskTree } from "@/components/TaskTree";
import { Timer } from "@/components/Timer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDeviseSize } from "@/hooks/useDeviseSize";
import { TaskSideView } from "./partials/TaskSideView";
import { TaskTagList } from "./partials/TaskTagList";
import { TaskTools } from "./partials/TaskTools";

import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  return <p>Tablet</p>;
};

const MobileLayout = () => {
  return (
    <Tabs
      defaultValue="timer"
      className="h-full max-h-full min-h-full overflow-hidden bg-white"
    >
      <TabsContent value="timer">
        <Timer />
      </TabsContent>

      <TabsContent value="tag">
        <TaskTagList />
      </TabsContent>

      <TabsContent value="tree">
        <TaskTree />
      </TabsContent>

      <TabsContent value="side">
        <TaskSideView />
      </TabsContent>

      <TabsList className="fixed bottom-0 z-10 flex w-full justify-around border-t bg-border bg-white/80 dark:border-gray-700">
        <TabsTrigger value="timer">Timer</TabsTrigger>
        <Separator orientation="vertical" />
        <TabsTrigger value="tag">Tag</TabsTrigger>
        <Separator orientation="vertical" />
        <TabsTrigger value="tree">Tree</TabsTrigger>
        <Separator orientation="vertical" />
        <TabsTrigger value="side">Side</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
