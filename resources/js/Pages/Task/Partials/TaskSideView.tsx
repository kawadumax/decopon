import { taskSelectorAtom } from "@/Lib/atoms";
import type { Task } from "@/types";
import { useAtomValue } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { TaskEditableDescription } from "./TaskEditableDescription";
import { TaskEditableTagList } from "./TaskEditableTagList";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { TaskLogger } from "./TaskLogger";
import { useTranslation } from "react-i18next";
export const TaskSideView = () => {
	const currentTaskAtom = useAtomValue(taskSelectorAtom);
	const currentTask = useAtomValue(currentTaskAtom);
	const { t } = useTranslation();
	const renderTaskContent = () => {
		if (!currentTask) {
			return t("task.noCurrent");
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
