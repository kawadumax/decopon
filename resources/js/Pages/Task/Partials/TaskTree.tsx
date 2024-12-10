import { TaskItem } from "./TaskItem";
import { useAtom } from "jotai";
import { taskAtomsAtom } from "@/Lib/atoms";

export const TaskTree = () => {
    const [taskAtoms, dispatch] = useAtom(taskAtomsAtom);
    return (
        <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
            {taskAtoms.map((taskAtom) => (
                <TaskItem
                    taskAtom={taskAtom}
                    remove={() => dispatch({ type: "remove", atom: taskAtom })}
                    key={`${taskAtom}`}
                ></TaskItem>
            ))}
        </ul>
    );
};
