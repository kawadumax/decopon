import { useAtom, useAtomValue } from "jotai";
import { taskSelectorAtom } from "@/Lib/atoms";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { Task } from "@/types";
import { PrimitiveAtom } from "jotai";
import { TaskEditableDescription } from "./TaskEditableDescription";
import { TaskLogger } from "./TaskLogger";
export const TaskSideView = () => {
    const currentTaskAtom = useAtomValue(taskSelectorAtom);
    const currentTask = useAtomValue(currentTaskAtom);

    const renderTaskContent = () => {
        if (!currentTask) {
            return "選択されていません";
        } else {
            return (
                <>
                    <TaskEditableTitle
                        taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
                        variant="lg"
                    ></TaskEditableTitle>
                    <TaskEditableDescription
                        taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
                    ></TaskEditableDescription>
                    <TaskLogger
                        taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
                    ></TaskLogger>
                </>
            );
        }
    };

    return (
        <div className="p-4 flex flex-col h-full">{renderTaskContent()}</div>
    );
};
