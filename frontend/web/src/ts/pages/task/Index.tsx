import { TagHeader } from "@/components/TagHeader";
import { Timer } from "@/components/Timer";
import { tasksAtom } from "@/lib/atoms";
import type { PageProps, Task } from "@/types";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Split from "react-split";
import { TaskTree } from "../../components/TaskTree";
import { TaskSideView } from "./partials/TaskSideView";
import { TaskTagList } from "./partials/TaskTagList";
import { TaskTools } from "./partials/TaskTools";

export default function Index(
	props: PageProps<{
		tasks: Task[];
	}>,
) {
	const { t } = useTranslation();

	const setTasks = useSetAtom(tasksAtom);
	useEffect(() => {
		setTasks(props.tasks);
	}, [props.tasks, setTasks]);

	return (
		<Split
			className="flex flex-row min-h-full max-h-full bg-white"
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
				<div className="shadow-sm dark:bg-gray-800 overflow-scroll hidden-scrollbar flex flex-col justify-start">
					<TaskTagList />
				</div>
				<div className="shadow-sm dark:bg-gray-800 max-h-full">
					<Timer />
				</div>
			</Split>
			<div className="overflow-auto hidden-scrollbar shadow-sm dark:bg-gray-800 max-h-full">
				<TaskTools />
				<TagHeader />
				<TaskTree />
			</div>
			<div className="overflow-hidden shadow-sm dark:bg-gray-800 max-h-full">
				<TaskSideView />
			</div>
		</Split>
	);
}
