import { useAtom, useAtomValue } from "jotai";
import { taskAtomsAtom, tasksAtom } from "@/Lib/atoms";
import { selectedTaskAtomAtom } from "@/Lib/atoms";
import { useEffect } from "react";
import { TaskEditableTitle } from "./TaskEditableTitle";
import { Task } from "@/types";
export const TaskSideView = () => {
    // const [tasks] = useAtom(tasksAtom);
    // const selectedId = useAtomValue(selectedTaskIdAtom);
    const selectedTaskAtom = useAtomValue(selectedTaskAtomAtom);
    const selectedTask: Task | undefined = useAtomValue(selectedTaskAtom);

    useEffect(() => {
        console.log(selectedTaskAtom);
    }, [selectedTaskAtom]);

    const renderTaskContent = () => {
        if (!selectedTaskAtom) {
            return "選択されていません";
        } else {
            if (selectedTaskAtom && selectedTask) {
                return (
                    <>
                        <TaskEditableTitle
                            taskAtom={selectedTaskAtom}
                        ></TaskEditableTitle>
                        <p>{selectedTask.description}</p>
                    </>
                );
            } else {
                return "タスクが見つかりません";
            }
        }
    };

    return <div className="p-4">{renderTaskContent()}</div>;
};
