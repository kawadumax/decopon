import { TagHeader } from "@/components/TagHeader";
import { Timer } from "@/components/Timer";
import type {} from "@/types";
import Split from "react-split";
import { TaskTree } from "../../components/TaskTree";
import { TaskSideView } from "./partials/TaskSideView";
import { TaskTagList } from "./partials/TaskTagList";
import { TaskTools } from "./partials/TaskTools";

export default function Index(
  // props: PageProps<{
  //   tasks: Task[];
  // }>,
) {
  // const setTasks = useSetAtom(tasksAtom);
  // useEffect(() => {
  //   setTasks(props.tasks);
  // }, [props.tasks, setTasks]);

  return (
    <Split
      className="flex max-h-full min-h-full flex-row bg-white"
      sizes={[17.2, 41.4, 41.4]} // 白銀比を元にした比率
      gutterSize={1}
      gutter={() => {
        const gutterElement = document.createElement("div");
        gutterElement.className =
          "w-2 bg-stone-50 hover:cursor-col-resize hover:w-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out";
        return gutterElement;
      }}
      // 元のgutterのスタイルを削除
      gutterStyle={() => ({})}
    >
      <Split
        className="split flex flex-col"
        sizes={[50, 50]}
        gutterSize={1}
        direction="vertical"
        gutter={() => {
          const gutterElement = document.createElement("div");
          gutterElement.className =
            "h-2 bg-stone-50 hover:cursor-row-resize hover:h-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out";

          return gutterElement;
        }}
        // 元のgutterのスタイルを削除
        gutterStyle={() => ({})}
      >
        <div className="hidden-scrollbar flex flex-col justify-start overflow-scroll shadow-sm dark:bg-gray-800">
          <TaskTagList />
        </div>
        <div className="max-h-full shadow-sm dark:bg-gray-800">
          <Timer />
        </div>
      </Split>
      <div className="hidden-scrollbar max-h-full overflow-auto shadow-sm dark:bg-gray-800">
        <TaskTools />
        <TagHeader />
        <TaskTree />
      </div>
      <div className="max-h-full overflow-hidden shadow-sm dark:bg-gray-800">
        <TaskSideView />
      </div>
    </Split>
  );
}
