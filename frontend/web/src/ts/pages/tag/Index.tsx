import { TagHeader } from "@/components/TagHeader";
import { TaskTree } from "@/components/TaskTree";
import { tagsAtom } from "@/lib/atoms";
import type { PageProps } from "@/types";
import type { Tag } from "@/types";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { TagTable } from "./partials/TagTable";
import { TagTools } from "./partials/TagTools";

export default function Index(
  props: PageProps<{
    tags: Tag[];
  }>,
) {
  const [tags, setTags] = useAtom(tagsAtom);
  useEffect(() => {
    setTags(props.tags);
  }, [props.tags, setTags]);

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
}
