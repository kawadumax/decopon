import { useAtom, useAtomValue } from "jotai";
import { taskSelectorAtom } from "@/Lib/atoms";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { Task } from "@/types";
import { PrimitiveAtom } from "jotai";
import { TaskEditableDescription } from "./TaskEditableDescription";
export const TaskSideView = () => {
    const currentTaskAtom = useAtomValue(taskSelectorAtom);
    const currentTask = useAtomValue(currentTaskAtom);

    const renderTaskContent = () => {
        if (!currentTask) {
            return "選択されていません";
        } else {
            if (currentTask) {
                return (
                    <>
                        <TaskEditableTitle
                            taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
                        ></TaskEditableTitle>
                        <TaskEditableDescription
                            taskAtom={currentTaskAtom as PrimitiveAtom<Task>}
                        ></TaskEditableDescription>
                    </>
                );
            } else {
                return "タスクが見つかりません";
            }
        }
    };

    return <div className="p-4">{renderTaskContent()}</div>;
};
