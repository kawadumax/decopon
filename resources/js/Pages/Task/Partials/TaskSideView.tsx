import { useAtom, useAtomValue } from "jotai";
import { tasksAtom } from "@/Lib/atoms";
import { selectedTaskIdAtom } from "@/Lib/atoms";
import { Checkbox } from "@/Components/ui/checkbox";
import { useEffect } from "react";
export const TaskSideView = () => {
    const [tasks] = useAtom(tasksAtom);
    const selectedId = useAtomValue(selectedTaskIdAtom);

    useEffect(() => {
        console.log(tasks);
    }, [selectedId, tasks]);

    const renderTaskContent = () => {
        if (!selectedId) {
            return "選択されていません";
        } else {
            const selectedTask = tasks.find((task) => task.id === selectedId);
            if (selectedTask) {
                return (
                    <>
                        <h2 className="text-xl font-bold mb-2">
                            <span className="mr-2">
                                <Checkbox checked={selectedTask.completed} />
                            </span>
                            <span>{selectedTask.title}</span>
                        </h2>
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
