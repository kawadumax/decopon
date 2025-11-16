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
    <div className="flex min-h-full flex-col bg-surface">
      <div className="hidden-scrollbar flex max-h-full flex-1 flex-col overflow-auto shadow-xs dark:bg-surface-inverse">
        <StackViewList initialPanelId="default">
          <StackViewPanel panelId="default" className="size-full bg-surface p-4">
            <TagTools />
            <TagTable />
          </StackViewPanel>
          <StackViewPanel panelId="detail" className="size-full bg-surface">
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
      className="flex max-h-full min-h-full flex-row bg-surface"
    >
      <ResizablePanel className="p-8 py-2">
        <TagTools />
        <TagTable />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
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
