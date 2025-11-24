import { Loading } from "@components/Loading";
import { StackViewList, StackViewPanel } from "@components/StackView";
import { TagHeader } from "@components/TagHeader";
import { TaskTree } from "@components/TaskTree";
import { Timer } from "@components/Timer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { TaskSideView } from "./partials/TaskSideView";
import { TaskTagList } from "./partials/TaskTagList";
import { TaskTools } from "./partials/TaskTools";

export default function Index() {
  const deviceSize = useDeviceSize();
  const layouts = {
    pc: PCLayout,
    tablet: TabletLayout,
    mobile: MobileLayout,
  } as const;
  const Layout = deviceSize ? layouts[deviceSize] : undefined;
  return Layout ? <Layout /> : <Loading />;
}

const ResizableLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row divide-x divide-line bg-surface dark:divide-line-subtle dark:bg-surface"
    >
      {children}
    </ResizablePanelGroup>
  );
};

const MainPanel = () => {
  return (
    <>
      <TaskTools />
      <TagHeader />
      <TaskTree />
    </>
  );
};

const PCLayout = () => {
  return (
    <ResizableLayout>
      <ResizablePanel defaultSize={17.2} className="bg-surface-muted dark:bg-surface-muted">
        <ResizablePanelGroup
          direction="vertical"
          className="divide-y divide-line dark:divide-line-subtle"
        >
          <ResizablePanel
            defaultSize={50}
            className="hidden-scrollbar flex flex-col justify-start overflow-scroll bg-surface-muted shadow-xs dark:bg-surface-muted"
          >
            <TaskTagList />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel className="max-h-full bg-surface shadow-xs dark:bg-surface">
            <Timer />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={41.4}
        className="hidden-scrollbar max-h-full overflow-auto bg-surface shadow-xs dark:bg-surface"
      >
        <MainPanel />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel className="max-h-full overflow-hidden bg-surface-muted shadow-xs dark:bg-surface-muted">
        <TaskSideView />
      </ResizablePanel>
    </ResizableLayout>
  );
};

const TabletLayout = () => {
  return (
    <ResizableLayout>
      <ResizablePanel
        defaultSize={50}
        className="hidden-scrollbar max-h-full overflow-auto bg-surface shadow-xs dark:bg-surface"
      >
        <MainPanel />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel className="max-h-full overflow-hidden bg-surface-muted shadow-xs dark:bg-surface-muted">
        <TaskSideView />
      </ResizablePanel>
    </ResizableLayout>
  );
};

const MobileLayout = () => {
  return (
    <div className="flex min-h-full flex-col bg-surface dark:bg-surface">
      <div className="hidden-scrollbar flex max-h-full flex-1 flex-col overflow-auto shadow-xs dark:bg-surface">
        <StackViewList initialPanelId="default">
          <StackViewPanel
            panelId="default"
            className="size-full bg-surface dark:bg-surface"
          >
            <MainPanel />
          </StackViewPanel>
          <StackViewPanel
            panelId="detail"
            className="size-full bg-surface dark:bg-surface"
          >
            <TaskSideView />
          </StackViewPanel>
        </StackViewList>
      </div>
    </div>
  );
};
