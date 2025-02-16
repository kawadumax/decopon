import { TagHeader } from "@/Components/TagHeader";
import { Timer } from "@/Components/Timer";
import { useApi } from "@/Hooks/useApi";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { currentTagAtom, tasksAtom } from "@/Lib/atoms";
import type { PageProps, Task } from "@/types";
import { Head } from "@inertiajs/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import Split from "react-split";
import { TaskTree } from "../../Components/TaskTree";
import { TaskSideView } from "./Partials/TaskSideView";
import { TaskTagList } from "./Partials/TaskTagList";
import { TaskTools } from "./Partials/TaskTools";

export default function Index(
	props: PageProps<{
		tasks: Task[];
	}>,
) {
	const currentTag = useAtomValue(currentTagAtom);
	const setTasks = useSetAtom(tasksAtom);

	useEffect(() => {
		setTasks(props.tasks);
	}, [setTasks, props.tasks]);
	return (
		<AuthenticatedLayout>
			<Head title="Task List" />

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
					gutter={() => {
						const gutterElement = document.createElement("div");
						gutterElement.className =
							"h-2 bg-stone-50 hover:cursor-row-resize hover:h-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out";
						return gutterElement;
					}}
					direction="vertical"
				>
					<div className="bg-stone-50 shadow-sm dark:bg-gray-800 overflow-scroll hidden-scrollbar">
						<TaskTagList />
					</div>
					<div className="bg-stone-50 shadow-sm dark:bg-gray-800 max-h-full">
						<Timer />
					</div>
				</Split>
				<div className="overflow-auto hidden-scrollbar bg-stone-50/50 shadow-sm dark:bg-gray-800 max-h-full">
					<TaskTools />
					<TagHeader />
					<TaskTree />
				</div>
				<div className="overflow-hidden bg-stone-50/20 shadow-sm dark:bg-gray-800 max-h-full">
					<TaskSideView />
				</div>
			</Split>
		</AuthenticatedLayout>
	);
}
