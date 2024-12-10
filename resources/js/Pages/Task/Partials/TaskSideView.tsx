import { useAtom, useAtomValue } from "jotai";
import { taskSelectorAtom } from "@/Lib/atoms";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { Task } from "@/types";
import { PrimitiveAtom } from "jotai";
export const TaskSideView = () => {
    const currentTaskAtom = useAtomValue(taskSelectorAtom);
    const [currentTask, setCurrentTask] = useAtom(currentTaskAtom)

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
                        <p>{currentTask.description}</p>
                    </>
                );
            } else {
                return "タスクが見つかりません";
            }
        }
    };

    return <div className="p-4">{renderTaskContent()}</div>;
};
