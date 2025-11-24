import { TagHeader } from "@components/TagHeader";
import { TaskTree } from "@components/TaskTree";

import { Loading } from "@components/Loading";
import { StackViewList, StackViewPanel } from "@components/StackView";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/ui/resizable";
import { useDeviceSize } from "@hooks/useDeviceSize";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTagsQueryOptions } from "@/scripts/queries";
import { useEffect } from "react";
import { TagTable } from "./partials/TagTable";
import { TagTools } from "./partials/TagTools";

const MobileLayout = () => {
  return (
    <div className="flex min-h-full flex-col bg-surface dark:bg-surface">
      <div className="hidden-scrollbar flex max-h-full flex-1 flex-col overflow-auto shadow-xs dark:bg-surface">
        <StackViewList initialPanelId="default">
          <StackViewPanel
            panelId="default"
            className="size-full bg-surface p-4 dark:bg-surface"
          >
            <TagTools />
            <TagTable />
          </StackViewPanel>
          <StackViewPanel
            panelId="detail"
            className="size-full bg-surface dark:bg-surface"
          >
            <TaskTree />
          </StackViewPanel>
        </StackViewList>
      </div>
    </div>
  );
};

const PCLayout = () => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row divide-x divide-line bg-surface dark:divide-line-subtle dark:bg-surface"
    >
      <ResizablePanel className="border-r border-line bg-surface-muted p-8 py-2 dark:border-line-subtle dark:bg-surface-muted">
        <TagTools />
        <TagTable />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="bg-surface dark:bg-surface">
        <TagHeader />
        <TaskTree />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default function Index() {
  const queryClient = useQueryClient();
  const { data: tags = [] } = useQuery(fetchTagsQueryOptions);
  const deviceSize = useDeviceSize();
  useEffect(() => {
    queryClient.setQueryData(["tags"], tags);
  }, [tags, queryClient]);

  if (deviceSize === undefined) {
    return <Loading />;
  }

  if (deviceSize === "mobile" || deviceSize === "tablet") {
    return <MobileLayout />;
  }

  return <PCLayout />;
}
