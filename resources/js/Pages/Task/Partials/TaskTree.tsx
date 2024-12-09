import { TaskItem } from "./TaskItem";
import { useAtom } from "jotai";
import { tasksAtom } from "@/Lib/atoms";

export const TaskTree = () => {
    const [tasks] = useAtom(tasksAtom);
    return (
        <ul className="flex flex-col list-inside list-disc dark:text-gray-200">
            {tasks.map((task) => (
                <TaskItem task={task} key={task.id}></TaskItem>
            ))}
        </ul>
    );
};
