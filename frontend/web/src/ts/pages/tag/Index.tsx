import { TagHeader } from "@/components/TagHeader";
import { TaskTree } from "@/components/TaskTree";
import { tagsAtom } from "@/lib/atoms";
import type { PageProps } from "@/types";
import type { Tag } from "@/types";

import { StackViewList, StackViewPanel } from "@/components/StackView";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { TagTable } from "./partials/TagTable";
import { TagTools } from "./partials/TagTools";

const MobileLayout = ({
  tags,
}: {
  tags: Tag[];
}) => {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="hidden-scrollbar flex max-h-full flex-1 flex-col overflow-auto shadow-xs dark:bg-gray-800">
        <StackViewList initialPanelId="default">
          <StackViewPanel panelId="default" className="size-full bg-white">
            <TagTools />
            <TagTable tags={tags} />
          </StackViewPanel>
          <StackViewPanel panelId="detail" className="size-full bg-white">
            <TaskTree />
          </StackViewPanel>
        </StackViewList>
      </div>
    </div>
  );
};

const PCLayout = ({
  tags,
}: {
  tags: Tag[];
}) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex max-h-full min-h-full flex-row bg-white"
    >
      <ResizablePanel className="p-8 py-2">
        <TagTools />
        <TagTable tags={tags} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        <TagHeader />
        <TaskTree />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default function Index(
  props: PageProps<{
    tags: Tag[];
  }>,
) {
  const [tags, setTags] = useAtom(tagsAtom);
  const deviceSize = useDeviceSize();
  useEffect(() => {
    setTags(props.tags);
  }, [props.tags, setTags]);

  if (deviceSize === "mobile") {
    return <MobileLayout tags={tags} />;
  }

  return <PCLayout tags={tags} />;
}
