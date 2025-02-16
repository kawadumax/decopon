import { taskSelectorAtom } from "@/Lib/atoms";
import type { Task } from "@/types";
import { useAtom, useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { TaskEditableDescription } from "./TaskEditableDescription";
import { TaskEditableTagList } from "./TaskEditableTagList";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { TaskLogger } from "./TaskLogger";
export const TaskSideView = () => {
	const currentTaskAtom = useAtomValue(taskSelectorAtom);
	const currentTask = useAtomValue(currentTaskAtom);

	const renderTaskContent = () => {
		if (!currentTask) {
			return "選択されていません";
		}
		return (
			<>
				<TaskEditableTitle
					taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
					variant="lg"
				/>
				<TaskEditableTagList
					taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
				/>
				<TaskEditableDescription
					taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
				/>
				<TaskLogger taskAtom={currentTaskAtom as PrimitiveAtom<Task>} />
			</>
		);
	};

	return <div className="p-4 flex flex-col h-full">{renderTaskContent()}</div>;
};
